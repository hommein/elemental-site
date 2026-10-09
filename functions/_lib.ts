export interface AuthEnv { DB: D1Database; SESSION_SECRET: string }
const enc = new TextEncoder();
export const json = (o: any, s = 200, headers: Record<string, string> = {}) =>
  new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store", ...headers } });

const b64u = (buf: ArrayBuffer) => btoa(String.fromCharCode(...new Uint8Array(buf))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
const ub64 = (s: string) => Uint8Array.from(atob(s.replace(/-/g, "+").replace(/_/g, "/")), c => c.charCodeAt(0));

async function hkey(secret: string) {
  return crypto.subtle.importKey("raw", enc.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign", "verify"]);
}
export async function makeSession(env: AuthEnv, uid: number, days = 90): Promise<string> {
  const payload = `${uid}.${Date.now() + days * 86400_000}`;
  const sig = b64u(await crypto.subtle.sign("HMAC", await hkey(env.SESSION_SECRET), enc.encode(payload)));
  return `${payload}.${sig}`;
}
export async function readSession(env: AuthEnv, request: Request): Promise<number | null> {
  const m = (request.headers.get("cookie") || "").match(/(?:^|;\s*)ea_sess=([^;]+)/);
  if (!m) return null;
  const parts = m[1].split(".");
  if (parts.length !== 3) return null;
  const [uid, exp, sig] = parts;
  if (Number(exp) < Date.now()) return null;
  const ok = await crypto.subtle.verify("HMAC", await hkey(env.SESSION_SECRET), ub64(sig), enc.encode(`${uid}.${exp}`));
  return ok ? Number(uid) : null;
}
export const sessionCookie = (tok: string, maxAge = 90 * 86400) =>
  `ea_sess=${tok}; Path=/; HttpOnly; Secure; SameSite=Lax; Max-Age=${maxAge}`;

export async function hashPw(pw: string, saltB64?: string): Promise<string> {
  const salt = saltB64 ? ub64(saltB64) : crypto.getRandomValues(new Uint8Array(16));
  const key = await crypto.subtle.importKey("raw", enc.encode(pw), "PBKDF2", false, ["deriveBits"]);
  const bits = await crypto.subtle.deriveBits({ name: "PBKDF2", hash: "SHA-256", salt, iterations: 100_000 }, key, 256);
  return `pbkdf2$${b64u(salt.buffer as ArrayBuffer)}$${b64u(bits)}`;
}
export async function verifyPw(pw: string, stored: string): Promise<boolean> {
  const [, salt, hash] = stored.split("$");
  return (await hashPw(pw, salt)).split("$")[2] === hash;
}
export async function memberFor(env: any, email: string, date: string) {
  return await env.DB.prepare(`SELECT m.id, m.end_date FROM memberships m JOIN users u ON u.id=m.user_id
    WHERE lower(u.email)=?1 AND m.start_date<=?2 AND m.end_date>=?2`).bind(email.toLowerCase(), date).first();
}

export async function getUser(env: AuthEnv, request: Request): Promise<any | null> {
  const uid = await readSession(env, request);
  if (!uid) return null;
  return env.DB.prepare("SELECT id, email, name, is_admin, cal_token, phone FROM users WHERE id = ?1").bind(uid).first();
}
export const randToken = () => b64u(crypto.getRandomValues(new Uint8Array(24)).buffer as ArrayBuffer);

export function normPhone(raw: string): string | null {
  const d = String(raw || "").replace(/\D/g, "");
  const ten = d.length === 11 && d[0] === "1" ? d.slice(1) : d;
  if (ten.length !== 10) return null;
  return `(${ten.slice(0, 3)}) ${ten.slice(3, 6)}-${ten.slice(6)}`;
}

// ---- canonical pricing (ONE definition; import everywhere) ----
export const PACK_CLASS_VALUE = 27.5;           // $110 pack / 4 classes
export const PACK_PRICE = 110;
export const priceOf = (r: { kind?: string; title?: string; category?: string }) =>
  r.kind === "opengym" ? 15 : r.title === "Community Jam" ? 10
  : (r.category === "flex" || r.category === "flow") ? 12 : 30;
// today's date in studio (Pacific) time — never UTC-date drift
export const ptToday = () =>
  new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });

/** Effective classes on a date: base weekly classes (active, one-off/end_date aware) with per-date overrides applied; cancelled ones dropped. */
export async function classesOn(db: D1Database, date: string): Promise<{ id: number; room: string; start: number; duration_min: number }[]> {
  const day = new Date(date + "T00:00:00Z").getUTCDay();
  const { results: cls } = await db.prepare(
    "SELECT id,time,duration_min,room,on_date,end_date FROM classes WHERE active=1 AND day=?"
  ).bind(day).all();
  const { results: ovs } = await db.prepare("SELECT * FROM overrides WHERE date=?").bind(date).all();
  const om: Record<number, any> = {};
  for (const o of ovs as any[]) om[o.class_id] = o;
  const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };
  const out: { id: number; room: string; start: number; duration_min: number }[] = [];
  for (const c of cls as any[]) {
    if (c.on_date && c.on_date !== date) continue;
    if (c.end_date && date > c.end_date) continue;
    const o = om[c.id];
    if (o?.cancelled) continue;
    const time = o?.time ? o.time : c.time;
    const dur = o?.duration_min != null && o.duration_min !== "" ? Number(o.duration_min) : c.duration_min;
    const room = o?.room ? o.room : c.room;
    out.push({ id: c.id, room, start: toMin(time), duration_min: dur });
  }
  return out;
}
