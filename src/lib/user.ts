export type User = { email: string; name: string; is_admin?: boolean; cal_token?: string; phone?: string | null; member_until?: string | null } | null;
let cached: User | undefined;
const subs = new Set<(u: User) => void>();
export async function me(force = false): Promise<User> {
  if (cached !== undefined && !force) return cached;
  try { cached = (await (await fetch("/api/me")).json()).user; } catch { cached = null; }
  subs.forEach(f => f(cached!));
  return cached!;
}
export function setUser(u: User) { cached = u; subs.forEach(f => f(u)); }
export function onUser(f: (u: User) => void) { subs.add(f); return () => { subs.delete(f); }; }
