import { AuthEnv, json, getUser } from "../../_lib";

// POST /api/admin/upload  (multipart, field "file") → { url: "/api/media/ID" }
// Stored in D1 in ~900KB chunks (same trick as contact attachments). Public pages load it from /api/media/:id.
export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const u: any = await getUser(env, request);
  if (!u?.is_admin) return json({ error: "Admins only" }, 403);
  const form = await request.formData();
  const f = form.get("file");
  if (!(f instanceof File)) return json({ error: "No file" }, 400);
  if (f.size > 8_000_000) return json({ error: "File too big (8MB max)" }, 400);
  const buf = new Uint8Array(await f.arrayBuffer());
  const CHUNK = 900 * 1024;
  const name = f.name.slice(0, 120);
  const first = await env.DB.prepare("INSERT INTO media(name,type,size,part,data) VALUES(?,?,?,0,?) RETURNING id")
    .bind(name, f.type || null, f.size, buf.slice(0, CHUNK)).first<{ id: number }>();
  const id = first!.id;
  await env.DB.prepare("UPDATE media SET first_id=? WHERE id=?").bind(id, id).run();
  for (let part = 1, off = CHUNK; off < buf.length; part++, off += CHUNK) {
    await env.DB.prepare("INSERT INTO media(name,type,size,part,first_id,data) VALUES(?,?,?,?,?,?)")
      .bind(name, f.type || null, f.size, part, id, buf.slice(off, off + CHUNK)).run();
  }
  return json({ url: `/api/media/${id}`, id, size: f.size, name });
};
