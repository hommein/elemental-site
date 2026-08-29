import { AuthEnv, json, getUser } from "../_lib";
async function mu(env: any, uid: number) {
  const r: any = await env.DB.prepare("SELECT max(end_date) m FROM memberships WHERE user_id=?1").bind(uid).first();
  return r?.m || null;
}
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const u = await getUser(env, request);
  return json({ user: u ? { email: u.email, name: u.name, is_admin: !!u.is_admin, cal_token: u.cal_token, phone: u.phone || null, member_until: await mu(env, u.id) } : null });
};
