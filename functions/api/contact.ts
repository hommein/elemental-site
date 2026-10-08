import { json } from "../_lib";
type Env = { DB: D1Database; RESEND_API_KEY?: string; EMAIL_FROM?: string };
const STUDIO = "elementalaerialarts@gmail.com";
const MAX_TOTAL = 8 * 1024 * 1024;
const esc = (s: string) => s.replace(/[&<>]/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;" }[c] as string));
const b64 = (buf: ArrayBuffer) => { let s = ""; const a = new Uint8Array(buf); for (let i = 0; i < a.length; i += 0x8000) s += String.fromCharCode(...a.subarray(i, i + 0x8000)); return btoa(s); };

export const onRequestPost: PagesFunction<Env> = async ({ request, env }) => {
  let fd: FormData;
  try { fd = await request.formData(); } catch { return json({ error: "Bad form." }, 400); }
  const name = String(fd.get("name") || "").trim().slice(0, 120);
  const email = String(fd.get("email") || "").trim().slice(0, 200);
  const message = String(fd.get("message") || "").trim().slice(0, 5000);
  const subscribe = fd.get("subscribe") ? 1 : 0;
  if (String(fd.get("website") || "")) return json({ ok: true }); // honeypot
  if (!name || !/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email) || !message) return json({ error: "Name, a valid email, and a message are required." }, 400);

  const files = fd.getAll("files").filter((f): f is File => f instanceof File && f.size > 0);
  let total = 0; for (const f of files) total += f.size;
  if (total > MAX_TOTAL) return json({ error: "Attachments too large (8 MB max total)." }, 400);
  const attachments = await Promise.all(files.map(async f => ({ filename: f.name.slice(0, 120), content: b64(await f.arrayBuffer()) })));

  if (subscribe) await env.DB.prepare("INSERT OR IGNORE INTO email_list(email,name,source) VALUES(?,?,'contact')").bind(email.toLowerCase(), name).run();
  const row = await env.DB.prepare("INSERT INTO contact_messages(name,email,message,files,subscribed) VALUES(?,?,?,?,?)")
    .bind(name, email, message, files.map(f => f.name).join(", ") || null, subscribe).run();
  const id = row.meta.last_row_id;

  let sent = false, err: string | null = null;
  if (env.RESEND_API_KEY) {
    const from = env.EMAIL_FROM || "Elemental Aerial <onboarding@resend.dev>";
    const html = `<div style="font-family:Georgia,serif;max-width:600px">
      <p><b>From:</b> ${esc(name)} &lt;${esc(email)}&gt;</p>
      <p><b>Email list:</b> ${subscribe ? "yes" : "no"}</p>
      <p style="white-space:pre-wrap">${esc(message)}</p>
      ${files.length ? `<p><i>${files.length} attachment(s)</i></p>` : ""}
    </div>`;
    const r = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: { Authorization: `Bearer ${env.RESEND_API_KEY}`, "Content-Type": "application/json" },
      body: JSON.stringify({ from, to: [STUDIO], reply_to: email, subject: `Website contact from ${name}`, html, attachments }),
    });
    sent = r.ok; if (!r.ok) err = (await r.text()).slice(0, 300);
    if (sent) await env.DB.prepare("UPDATE contact_messages SET sent=1 WHERE id=?").bind(id).run();
  }
  return json({ ok: true, sent, err });
};
