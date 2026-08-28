interface Env { DB: D1Database }
const json = (o: any, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

export function ptEpoch(date: string, time: string): number {
  let t = Date.parse(`${date}T${time}:00-08:00`);
  const f = new Intl.DateTimeFormat("en-US", { timeZone: "America/Los_Angeles", hour12: false, hour: "2-digit", minute: "2-digit" });
  const parts = f.format(new Date(t));
  const [wh, wm] = parts.split(":").map(Number);
  const [gh, gm] = time.split(":").map(Number);
  let diff = (wh * 60 + wm) - (gh * 60 + gm);
  if (diff > 720) diff -= 1440; if (diff < -720) diff += 1440;
  return t - diff * 60000;
}
export const CUTOFF_MS = 12 * 3600 * 1000;

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const email = (new URL(request.url).searchParams.get("email") || "").trim().toLowerCase();
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return json({ error: "Valid email required" }, 400);
  const now = Date.now();
  const today = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

  const cls = await env.DB.prepare(
    `SELECT s.id, s.date, c.title, c.instructor, c.time, c.duration_min, c.room
     FROM signups s JOIN classes c ON c.id = s.class_id
     WHERE s.email = ?1 AND s.date >= ?2 ORDER BY s.date, c.time`
  ).bind(email, today).all();
  const og = await env.DB.prepare(
    `SELECT id, date, time, room FROM opengym WHERE email = ?1 AND date >= ?2 ORDER BY date, time`
  ).bind(email, today).all();

  const classes = (cls.results as any[]).map(r => ({ ...r, kind: "class", can_cancel: ptEpoch(r.date, r.time) - now >= CUTOFF_MS }));
  const opengym = (og.results as any[]).map(r => ({ ...r, kind: "opengym", title: "Open Gym", can_cancel: ptEpoch(r.date, r.time) - now >= CUTOFF_MS }));
  return json({ bookings: [...classes, ...opengym].sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time)) });
};
