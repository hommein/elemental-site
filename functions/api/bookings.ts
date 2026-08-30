interface Env { DB: D1Database }
const json = (o: any, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json", "cache-control": "no-store" } });

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
  const past = new URL(request.url).searchParams.get("past") === "1";

  const cls = await env.DB.prepare(
    `SELECT s.id, s.date, c.title, c.instructor, c.time, c.duration_min, c.room
     FROM signups s JOIN classes c ON c.id = s.class_id
     WHERE s.email = ?1 ORDER BY s.date, c.time`
  ).bind(email).all();
  const og = await env.DB.prepare(
    `SELECT id, date, time, room FROM opengym WHERE email = ?1 ORDER BY date, time`
  ).bind(email).all();

  const classes = (cls.results as any[]).map(r => ({ ...r, kind: "class" }));
  const opengym = (og.results as any[]).map(r => ({ ...r, kind: "opengym", title: "Open Gym", duration_min: 60 }));
  let all = [...classes, ...opengym]
    .map(r => ({ ...r, _end: ptEpoch(r.date, r.time) + (r.duration_min || 60) * 60000 }))
    .filter(r => past ? r._end <= now : r._end > now)
    .map(({ _end, ...r }) => ({ ...r, can_cancel: !past && ptEpoch(r.date, r.time) - now >= CUTOFF_MS }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
  if (past) all = all.reverse().slice(0, 100);
  return json({ bookings: all });
};
