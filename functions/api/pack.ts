import { AuthEnv, json, getUser } from "../_lib";

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const u: any = await getUser(env, request);
  if (!u) return json({ error: "Sign in" }, 401);
  const packs = (await env.DB.prepare("SELECT size,remaining,purchased_at FROM classpacks WHERE user_id=?1 ORDER BY id DESC LIMIT 3").bind(u.id).all()).results;
  const pays = (await env.DB.prepare("SELECT date,amount,method,unallocated FROM payments WHERE user_id=?1 ORDER BY id DESC LIMIT 5").bind(u.id).all()).results;
  const cr = await env.DB.prepare("SELECT COALESCE(SUM(unallocated),0) c FROM payments WHERE user_id=?1").bind(u.id).first<any>();
  return json({ packs, payments: pays, credit: Number(cr?.c || 0) });
};
