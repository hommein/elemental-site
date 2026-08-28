interface Env { DB: D1Database }
const ROOMS = ["Sun Room", "Foyer"];
const CAP = 4;

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let b: any; try { b = await request.json(); } catch { return err("Invalid JSON", 400); }
  const { date, time, room, name, email } = b || {};
  if (!date || !time || !room || !name || !email) return err("date, time, room, name, email required", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:00$/.test(time)) return err("Bad date/time (hour slots only)", 400);
  if (!ROOMS.includes(room)) return err("Unknown room", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err("Bad email", 400);
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 8 || h > 20) return err("Open gym is available 8am-9pm", 400);

  const day = new Date(date + "T00:00:00Z").getUTCDay();
  // conflict: any active class in this room overlapping [h, h+1)
  const cls: any = await env.DB.prepare(
    `SELECT title FROM classes WHERE active=1 AND day=? AND room=?
     AND (CAST(substr(time,1,2) AS INT)*60 + CAST(substr(time,4,2) AS INT)) < ?
     AND (CAST(substr(time,1,2) AS INT)*60 + CAST(substr(time,4,2) AS INT) + duration_min) > ?`
  ).bind(day, room, (h + 1) * 60, h * 60).first();
  if (cls) return err(`The ${room} has ${cls.title} at that time`, 409);

  const cnt: any = await env.DB.prepare("SELECT COUNT(*) n FROM opengym WHERE date=? AND time=? AND room=?").bind(date, time, room).first();
  if (cnt.n >= CAP) return err("That open gym slot is full", 409);
  try {
    await env.DB.prepare("INSERT INTO opengym(date,time,room,name,email) VALUES(?,?,?,?,?)")
      .bind(date, time, room, name.trim().slice(0, 80), email.trim().toLowerCase()).run();
  } catch (e: any) {
    if (String(e).includes("UNIQUE")) return err("You already booked this slot", 409);
    throw e;
  }
  return Response.json({ ok: true, spots_left: CAP - cnt.n - 1 });
};
const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
