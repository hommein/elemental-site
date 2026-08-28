import { AuthEnv, json, makeSession, sessionCookie, hashPw, verifyPw, getUser, randToken } from "../../_lib";

const GOOGLE_CLIENT_ID = "119603995086-p8d32a3mlbm2cdl1e9h8bkrqe7vlnrbm.apps.googleusercontent.com";

async function googleAuth(env: AuthEnv, b: any): Promise<Response> {
  const credential = String(b?.credential || "");
  if (!credential) return json({ error: "Missing credential" }, 400);

  // Verify the ID token with Google's tokeninfo endpoint (checks signature + expiry for us).
  const r = await fetch("https://oauth2.googleapis.com/tokeninfo?id_token=" + encodeURIComponent(credential));
  if (!r.ok) return json({ error: "Google sign-in could not be verified" }, 401);
  const t: any = await r.json();

  if (t.aud !== GOOGLE_CLIENT_ID) return json({ error: "Token audience mismatch" }, 401);
  if (t.iss !== "https://accounts.google.com" && t.iss !== "accounts.google.com")
    return json({ error: "Bad token issuer" }, 401);
  if (Number(t.exp) * 1000 < Date.now()) return json({ error: "Token expired" }, 401);
  if (t.email_verified !== "true" && t.email_verified !== true)
    return json({ error: "Google account email is not verified" }, 401);

  const sub = String(t.sub);
  const gEmail = String(t.email).toLowerCase();
  const gName = String(t.name || t.given_name || gEmail.split("@")[0]);

  let u: any = await env.DB.prepare("SELECT id, name FROM users WHERE google_sub = ?1").bind(sub).first();
  if (!u) {
    const byEmail: any = await env.DB.prepare("SELECT id, name FROM users WHERE email = ?1").bind(gEmail).first();
    if (byEmail) {
      await env.DB.prepare("UPDATE users SET google_sub = ?1, pw_hash = NULL, name = COALESCE(name, ?2), cal_token = COALESCE(cal_token, ?3) WHERE id = ?4")
        .bind(sub, gName, randToken(), byEmail.id).run();
      u = byEmail;
    } else {
      const ins = await env.DB.prepare("INSERT INTO users(email, name, google_sub, cal_token) VALUES(?1, ?2, ?3, ?4)")
        .bind(gEmail, gName, sub, randToken()).run();
      u = { id: ins.meta.last_row_id as number, name: gName };
    }
  }

  return json({ ok: true, user: { email: gEmail, name: u.name || gName } }, 200,
    { "set-cookie": sessionCookie(await makeSession(env, u.id)) });
}

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request, params }) => {
  const action = params.action as string;
  if (action === "logout") return json({ ok: true }, 200, { "set-cookie": sessionCookie("", 0) });

  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (action === "google") return googleAuth(env, b);

  const email = String(b?.email || "").trim().toLowerCase();
  const password = String(b?.password || "");
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email required" }, 400);

  if (action === "register") {
    const name = String(b?.name || "").trim();
    if (!name) return json({ error: "Name required" }, 400);
    if (password.length < 8) return json({ error: "Password must be at least 8 characters" }, 400);
    const existing: any = await env.DB.prepare("SELECT id, pw_hash, google_sub FROM users WHERE email = ?1").bind(email).first();
    if (existing?.google_sub) return json({ error: "That email is linked to Google — use \u201cContinue with Google\u201d instead" }, 409);
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
    const u: any = await env.DB.prepare("SELECT id, email, name, pw_hash, google_sub FROM users WHERE email = ?1").bind(email).first();
    if (u?.google_sub) return json({ error: "This account uses Google sign-in — use \u201cContinue with Google\u201d instead" }, 409);
    if (!u?.pw_hash || !(await verifyPw(password, u.pw_hash))) return json({ error: "Wrong email or password" }, 401);
    return json({ ok: true, user: { email: u.email, name: u.name } }, 200, { "set-cookie": sessionCookie(await makeSession(env, u.id)) });
  }
  return json({ error: "Unknown action" }, 404);
};
