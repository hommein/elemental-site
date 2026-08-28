import { AuthEnv, json, getUser } from "../../_lib";

type Env = AuthEnv & { RESEND_API_KEY?: string; EMAIL_FROM?: string };

async function admin(env: Env, request: Request) {
  const u = await getUser(env, request);
  return u && u.is_admin ? u : null;
}

// GET -> { templates, recipients } ; recipients carry flags for group filters
export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  if (!(await admin(env, request))) return json({ error: "Admins only" }, 403);
  const templates = (await env.DB.prepare("SELECT * FROM email_templates ORDER BY updated_at DESC").all()).results;
  const users = (await env.DB.prepare("SELECT id,name,email,phone FROM users ORDER BY name").all()).results as any[];
  const packs = (await env.DB.prepare("SELECT user_id, SUM(remaining) rem FROM classpacks GROUP BY user_id").all()).results as any[];
  const since = new Date(Date.now() - 30 * 864e5).toISOString().slice(0, 10);
  const recent = (await env.DB.prepare("SELECT DISTINCT email FROM (SELECT email,date FROM signups UNION SELECT email,date FROM opengym) WHERE date >= ?1").bind(since).all()).results as any[];
  const recentSet = new Set(recent.map((r: any) => String(r.email).toLowerCase()));
  const remBy: Record<number, number> = {};
  for (const p of packs) remBy[p.user_id] = p.rem;
  const recipients = users.map(u => ({
    id: u.id, name: u.name, email: u.email,
    has_pack: (remBy[u.id] || 0) > 0,
    active_30d: recentSet.has(String(u.email).toLowerCase()),
  }));
  return json({ templates, recipients, configured: !!env.RESEND_API_KEY });
};

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  if (!(await admin(env, request))) return json({ error: "Admins only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (b.op === "save_template") {
    if (b.id) {
      await env.DB.prepare("UPDATE email_templates SET name=?1, subject=?2, html=?3, updated_at=datetime('now') WHERE id=?4")
        .bind(b.name || "Untitled", b.subject || "", b.html || "", b.id).run();
      return json({ ok: true, id: b.id });
    }
    const r = await env.DB.prepare("INSERT INTO email_templates(name,subject,html) VALUES(?1,?2,?3)")
      .bind(b.name || "Untitled", b.subject || "", b.html || "").run();
    return json({ ok: true, id: r.meta.last_row_id });
  }
  if (b.op === "delete_template") {
    await env.DB.prepare("DELETE FROM email_templates WHERE id=?1").bind(b.id).run();
    return json({ ok: true });
  }

  if (b.op === "send") {
    if (!env.RESEND_API_KEY) return json({ error: "Email sending is not configured yet (missing RESEND_API_KEY)." }, 500);
    const to: string[] = Array.isArray(b.to) ? b.to.filter((e: string) => /@/.test(e)) : [];
    if (!to.length) return json({ error: "No recipients." }, 400);
    if (!b.subject) return json({ error: "Subject required." }, 400);
    const from = env.EMAIL_FROM || "Elemental Aerial <onboarding@resend.dev>";
    const html = `<div style="font-family:Georgia,serif;max-width:600px;margin:0 auto">${b.html || ""}</div>`;
    const results: any[] = [];
    // send individually (bcc-style privacy), batches of 5
    for (let i = 0; i < to.length; i += 5) {
      const batch = to.slice(i, i + 5).map(rcpt =>
        fetch("https://api.resend.com/emails", {
          method: "POST",
          headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
          body: JSON.stringify({ from, to: [rcpt], subject: b.subject, html,
            reply_to: "elementalaerialarts@gmail.com",
            attachments: (b.attachments || []).map((a: any) => ({ filename: a.filename, content: a.content })) }),
        }).then(async r => ({ to: rcpt, ok: r.ok, err: r.ok ? null : (await r.text()).slice(0, 200) })));
      results.push(...(await Promise.all(batch)));
    }
    const sent = results.filter(r => r.ok).length;
    return json({ ok: sent > 0, sent, failed: results.filter(r => !r.ok) });
  }
  return json({ error: "Unknown op" }, 400);
};
