import { AuthEnv, json, getUser } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u: any = await getUser(env, request);
  return u?.is_admin ? u : null;
}
const SECTIONS = ["featured", "show", "retreat", "fave"];
const FIELDS = ["section","title","date","when_text","where_text","img","body","links","sort_order","active"] as const;

function clean(p: any) {
  if (!SECTIONS.includes(p.section)) return "bad section";
  if (!p.title?.trim()) return "title required";
  if (p.date && !/^\d{4}-\d{2}-\d{2}$/.test(p.date)) return "date must be YYYY-MM-DD";
  try { if (!Array.isArray(JSON.parse(p.body || "[]"))) return "bad body"; } catch { return "bad body"; }
  try { if (p.links) JSON.parse(p.links); } catch { return "bad links"; }
  return null;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  const r = await env.DB.prepare("SELECT * FROM posts ORDER BY section, sort_order, id").all();
  return json({ posts: r.results });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (b.op === "delete") {
    await env.DB.prepare("UPDATE posts SET active=0 WHERE id=?").bind(b.id).run();
    return json({ ok: true });
  }
  if (b.op === "restore") {
    await env.DB.prepare("UPDATE posts SET active=1 WHERE id=?").bind(b.id).run();
    return json({ ok: true });
  }
  const p = b.post || {};
  p.date = p.date || null; p.when_text = p.when_text || null; p.where_text = p.where_text || null;
  p.img = p.img || null; p.links = p.links || null; p.body = p.body || "[]";
  p.sort_order = Number(p.sort_order) || 0; p.active = p.active ? 1 : 0;
  const err = clean(p);
  if (err) return json({ error: err }, 400);

  if (b.op === "create") {
    const r = await env.DB.prepare(
      `INSERT INTO posts (${FIELDS.join(",")}) VALUES (?,?,?,?,?,?,?,?,?,?)`
    ).bind(...FIELDS.map(f => p[f])).run();
    return json({ ok: true, id: r.meta.last_row_id });
  }
  if (b.op === "update") {
    if (!b.id) return json({ error: "id required" }, 400);
    await env.DB.prepare(
      `UPDATE posts SET ${FIELDS.map(f => f + "=?").join(",")} WHERE id=?`
    ).bind(...FIELDS.map(f => p[f]), b.id).run();
    return json({ ok: true });
  }
  return json({ error: "Unknown op" }, 400);
};
