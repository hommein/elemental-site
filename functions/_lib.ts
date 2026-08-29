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
