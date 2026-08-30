import { AuthEnv, json } from "../_lib";

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env }) => {
  const r = await env.DB.prepare(
    "SELECT id,section,title,date,when_text,where_text,img,body,links,sort_order FROM posts WHERE active=1 ORDER BY sort_order, COALESCE(date,'') DESC, id"
  ).all();
  const out: Record<string, any[]> = { featured: [], show: [], retreat: [], fave: [] };
  for (const p of r.results as any[]) {
    if (!out[p.section]) out[p.section] = [];
    out[p.section].push({ ...p, body: JSON.parse(p.body || "[]"), links: p.links ? JSON.parse(p.links) : null });
  }
  return json(out);
};
