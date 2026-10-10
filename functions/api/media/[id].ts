import { AuthEnv, json } from "../../_lib";

// GET /api/media/:id → public, long-cached (ids never change content)
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, params }) => {
  const id = Number(params.id);
  if (!id) return json({ error: "Not found" }, 404);
  const first = await env.DB.prepare("SELECT name, type, size FROM media WHERE id=? AND part=0").bind(id).first<any>();
  if (!first) return json({ error: "Not found" }, 404);
  const parts = (await env.DB.prepare("SELECT data FROM media WHERE first_id=? ORDER BY part").bind(id).all<any>()).results;
  const out = new Uint8Array(first.size); let off = 0;
  for (const p of parts) { const a = new Uint8Array(p.data); out.set(a, off); off += a.length; }
  const safe = first.name.replace(/[^\w.\- ]+/g, "_");
  return new Response(out.subarray(0, off), { headers: {
    "Content-Type": first.type || "application/octet-stream",
    "Content-Disposition": `inline; filename="${safe}"`,
    "Cache-Control": "public, max-age=31536000, immutable",
  } });
};
