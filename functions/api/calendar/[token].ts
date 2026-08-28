import { ptEpoch } from "../bookings";

interface Env { DB: D1Database }

const utc = (ms: number) => new Date(ms).toISOString().replace(/[-:]/g, "").replace(/\.\d{3}Z$/, "Z");
const esc = (s: string) => s.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,");

export const onRequestGet: PagesFunction<Env> = async ({ env, params }) => {
  const token = String(params.token || "").replace(/\.ics$/i, "");
  if (!/^[A-Za-z0-9_-]{16,}$/.test(token)) return new Response("Not found", { status: 404 });
  const u: any = await env.DB.prepare("SELECT id, email FROM users WHERE cal_token = ?1").bind(token).first();
  if (!u) return new Response("Not found", { status: 404 });

  const since = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" })
    .format(new Date(Date.now() - 30 * 86400_000));
  const cls = await env.DB.prepare(
    `SELECT s.id, s.date, c.title, c.instructor, c.time, c.duration_min, c.room
     FROM signups s JOIN classes c ON c.id = s.class_id
     WHERE s.email = ?1 AND s.date >= ?2 ORDER BY s.date, c.time`
  ).bind(u.email, since).all();
  const og = await env.DB.prepare(
    `SELECT id, date, time, room FROM opengym WHERE email = ?1 AND date >= ?2 ORDER BY date, time`
  ).bind(u.email, since).all();

  const now = utc(Date.now());
  const loc = "Elemental Aerial Arts\\, 22 W Mission St\\, Santa Barbara\\, CA";
  const ev = (uid: string, startMs: number, mins: number, summary: string, desc: string) => [
    "BEGIN:VEVENT",
    `UID:${uid}@elemental-7t2.pages.dev`,
    `DTSTAMP:${now}`,
    `DTSTART:${utc(startMs)}`,
    `DTEND:${utc(startMs + mins * 60000)}`,
    `SUMMARY:${esc(summary)}`,
    desc ? `DESCRIPTION:${esc(desc)}` : "",
    `LOCATION:${loc}`,
    "END:VEVENT",
  ].filter(Boolean);

  const lines: string[] = [
    "BEGIN:VCALENDAR", "VERSION:2.0",
    "PRODID:-//Elemental Aerial Arts//Bookings//EN",
    "CALSCALE:GREGORIAN", "METHOD:PUBLISH",
    "X-WR-CALNAME:Elemental Aerial Arts",
    "X-WR-TIMEZONE:America/Los_Angeles",
  ];
  for (const r of cls.results as any[])
    lines.push(...ev(`class-${r.id}`, ptEpoch(r.date, r.time), r.duration_min || 60,
      r.title, [r.instructor && `Instructor: ${r.instructor}`, r.room && `Room: ${r.room}`].filter(Boolean).join(" — ")));
  for (const r of og.results as any[])
    lines.push(...ev(`og-${r.id}`, ptEpoch(r.date, r.time), 60, "Open Gym", r.room ? `Room: ${r.room}` : ""));
  lines.push("END:VCALENDAR");

  return new Response(lines.join("\r\n") + "\r\n", {
    headers: { "content-type": "text/calendar; charset=utf-8",
               "content-disposition": "inline; filename=elemental.ics" } });
};
