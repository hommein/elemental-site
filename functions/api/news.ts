import { AuthEnv, json } from "../_lib";

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env }) => {
  const r = await env.DB.prepare(
    "SELECT id,title,date,img,body,links FROM news WHERE active=1 ORDER BY date DESC, id DESC"
  ).all();
  const posts = (r.results as any[]).map(p => ({ ...p, body: JSON.parse(p.body || "[]"), links: p.links ? JSON.parse(p.links) : null }));
  return json({ posts });
};
