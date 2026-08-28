import { ptEpoch } from "./bookings";
import { getUser } from "../_lib";
interface Env { DB: D1Database; SESSION_SECRET: string }
const ROOMS = ["Sun Room", "Foyer"];
const CAP = 2; // spots per room per hour

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let b: any; try { b = await request.json(); } catch { return err("Invalid JSON", 400); }
  const { date, time, name, email } = b || {};
  if (!date || !time || !name || !email) return err("date, time, name, email required", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:00$/.test(time)) return err("Bad date/time (hour slots only)", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err("Bad email", 400);
  const h = parseInt(time.slice(0, 2), 10);
  if (h < 8 || h > 20) return err("Open gym is available 8am-9pm", 400);

  if (ptEpoch(date, time) <= Date.now()) {
    const u: any = await getUser(env as any, request);
    if (!u?.is_admin) return err("That time has already passed — pick an upcoming slot", 400);
  }

  const day = new Date(date + "T00:00:00Z").getUTCDay();
  const em = email.trim().toLowerCase();

  const dup: any = await env.DB.prepare(
    "SELECT 1 x FROM opengym WHERE date=? AND time=? AND email=?"
  ).bind(date, time, em).first();
  if (dup) return err("You already booked this slot", 409);

  // rooms blocked by classes overlapping [h, h+1)
  const { results: busy } = await env.DB.prepare(
    `SELECT DISTINCT room FROM classes WHERE active=1 AND day=?
     AND (CAST(substr(time,1,2) AS INT)*60 + CAST(substr(time,4,2) AS INT)) < ?
     AND (CAST(substr(time,1,2) AS INT)*60 + CAST(substr(time,4,2) AS INT) + duration_min) > ?`
  ).bind(day, (h + 1) * 60, h * 60).all();
  const blocked = new Set((busy as any[]).map(r => r.room));

  const { results: counts } = await env.DB.prepare(
    "SELECT room, COUNT(*) n FROM opengym WHERE date=? AND time=? GROUP BY room"
  ).bind(date, time).all();
  const booked: Record<string, number> = {};
  for (const r of counts as any[]) booked[r.room] = r.n;

  // pick the free room with the most space
  let room: string | null = null, best = 0;
  for (const r of ROOMS) {
    if (blocked.has(r)) continue;
    const left = CAP - (booked[r] || 0);
    if (left > best) { best = left; room = r; }
  }
  if (!room) return err("That time is fully booked or in use by a class", 409);

  try {
    await env.DB.prepare("INSERT INTO opengym(date,time,room,name,email) VALUES(?,?,?,?,?)")
      .bind(date, time, room, name.trim().slice(0, 80), em).run();
  } catch (e: any) {
    if (String(e).includes("UNIQUE")) return err("You already booked this slot", 409);
    throw e;
  }
  return Response.json({ ok: true, spots_left: best - 1 });
};
const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
