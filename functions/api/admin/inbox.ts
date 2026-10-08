import { AuthEnv, json, getUser } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u = await getUser(env, request);
  return u && u.is_admin ? u : null;
}

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!(await admin(env, request))) return json({ error: "Admins only" }, 403);
  const messages = (await env.DB.prepare("SELECT * FROM contact_messages ORDER BY id DESC LIMIT 500").all()).results;
  const list = (await env.DB.prepare("SELECT * FROM email_list ORDER BY id DESC").all()).results;
  return json({ messages, list });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!(await admin(env, request))) return json({ error: "Admins only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (b.op === "delete_message") { await env.DB.prepare("DELETE FROM contact_messages WHERE id=?").bind(b.id).run(); return json({ ok: true }); }
  if (b.op === "toggle_read") { await env.DB.prepare("UPDATE contact_messages SET read_at = CASE WHEN read_at IS NULL THEN datetime('now') ELSE NULL END WHERE id=?").bind(b.id).run(); return json({ ok: true }); }
  if (b.op === "remove_list") { await env.DB.prepare("DELETE FROM email_list WHERE id=?").bind(b.id).run(); return json({ ok: true }); }
  if (b.op === "add_list") {
    const email = String(b.email || "").trim().toLowerCase();
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Invalid email" }, 400);
    await env.DB.prepare("INSERT OR IGNORE INTO email_list(email,name,source) VALUES(?,?,'admin')").bind(email, b.name || null).run();
    return json({ ok: true });
  }
  return json({ error: "Unknown op" }, 400);
};
