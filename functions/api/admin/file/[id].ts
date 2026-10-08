import { AuthEnv, json, getUser } from "../../../_lib";
async function admin(env: AuthEnv, request: Request) { const u = await getUser(env, request); return u && u.is_admin ? u : null; }

// GET /api/admin/file/:id → download an attachment (id = first chunk's row id)
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request, params }) => {
  if (!(await admin(env, request))) return json({ error: "Admins only" }, 403);
  const first = await env.DB.prepare("SELECT message_id, name, type, size FROM contact_files WHERE id=? AND part=0").bind(params.id).first<any>();
  if (!first) return json({ error: "Not found" }, 404);
  const parts = (await env.DB.prepare("SELECT data FROM contact_files WHERE message_id=? AND name=? ORDER BY part").bind(first.message_id, first.name).all<any>()).results;
  const out = new Uint8Array(first.size); let off = 0;
  for (const p of parts) { const a = new Uint8Array(p.data); out.set(a, off); off += a.length; }
  const safe = first.name.replace(/[^\w.\- ]+/g, "_");
  return new Response(out.subarray(0, off), { headers: {
    "Content-Type": first.type || "application/octet-stream",
    "Content-Disposition": `inline; filename="${safe}"`,
    "Cache-Control": "private, max-age=3600",
  } });
};
