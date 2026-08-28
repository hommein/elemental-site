import { AuthEnv, json, makeSession, sessionCookie, hashPw, verifyPw, getUser, randToken } from "../../_lib";

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request, params }) => {
  const action = params.action as string;
  if (action === "logout") return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });

  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const email = String(b?.email || "").trim().toLowerCase();
  const password = String(b?.password || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email required" }, 400);

  if (action === "register") {
    const name = String(b?.name || "").trim();
    if (!name) return json({ error: "Name required" }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
    const existing: any = await env.DB.prepare("SELECT id, pw_hash FROM users WHERE email = ?1").bind(email).first();
    if (existing?.pw_hash) return json({ error: "An account with that email already exists — sign in instead" }, 409);
    const pw = await hashPw(password);
    let uid: number;
    if (existing) {
      await env.DB.prepare("UPDATE users SET pw_hash = ?1, name = ?2, cal_token = COALESCE(cal_token, ?3) WHERE id = ?4")
        .bind(pw, name, randToken(), existing.id).run();
      uid = existing.id;
    } else {
      const r = await env.DB.prepare("INSERT INTO users(email, name, pw_hash, cal_token) VALUES(?1, ?2, ?3, ?4)")
        .bind(email, name, pw, randToken()).run();
      uid = r.meta.last_row_id as number;
    }
    return json({ ok: true, user: { email, name } }, 200, { "set-cookie": sessionCookie(await makeSession(env, uid)) });
  }

  if (action === "login") {
    const u: any = await env.DB.prepare("SELECT id, email, name, pw_hash FROM users WHERE email = ?1").bind(email).first();
    if (!u?.pw_hash || !(await verifyPw(password, u.pw_hash))) return json({ error: "Wrong email or password" }, 401);
    return json({ ok: true, user: { email: u.email, name: u.name } }, 200, { "set-cookie": sessionCookie(await makeSession(env, u.id)) });
  }
  return json({ error: "Unknown action" }, 404);
};
