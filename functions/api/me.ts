import { AuthEnv, json, getUser } from "../_lib";
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const u = await getUser(env, request);
  return json({ user: u ? { email: u.email, name: u.name, is_admin: !!u.is_admin, cal_token: u.cal_token } : null });
};
