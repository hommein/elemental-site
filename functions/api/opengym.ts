import { ptEpoch } from "./bookings";
import { getUser, classesOn } from "../_lib";
interface Env { DB: D1Database; SESSION_SECRET: string }
const ROOMS = ["Sun Room", "Foyer"];
const CAP: Record<string, number> = { "Sun Room": 4, "Foyer": 2 }; // spots per room per hour

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let b: any; try { b = await request.json(); } catch { return err("Invalid JSON", 400); }
  const { date, time, name, email } = b || {};
  const pay = ["venmo", "cash", "membership"].includes(b?.pay_method) ? b.pay_method : "cash";
  if (!date || !time || !name || !email) return err("date, time, name, email required", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date) || !/^\d{2}:[03]0$/.test(time)) return err("Bad date/time (slots start on the hour or half hour)", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err("Bad email", 400);
  const start = parseInt(time.slice(0, 2), 10) * 60 + parseInt(time.slice(3, 5), 10);
  if (start < 8 * 60 || start + 60 > 21 * 60) return err("Open gym is available 8am-9pm", 400);

  if (ptEpoch(date, time) <= Date.now()) {
    const u: any = await getUser(env as any, request);
    if (!u?.is_admin) return err("That time has already passed — pick an upcoming slot", 400);
  }

  const em = email.trim().toLowerCase();

  // membership is self-reported; the studio confirms in person (admin roster shows pay method)

  const dup: any = await env.DB.prepare(
    "SELECT 1 x FROM opengym WHERE date=? AND time=? AND email=?"
  ).bind(date, time, em).first();
  if (dup) return err("You already booked this slot", 409);

  // rooms blocked by classes (with per-date overrides) overlapping [start, start+60)
  const cls = await classesOn(env.DB, date);
  const blocked = new Set(cls.filter(c => c.start < start + 60 && c.start + c.duration_min > start).map(c => c.room));

  // open gym bookings already in each room during this hour (any overlapping start time)
  const { results: counts } = await env.DB.prepare(
    "SELECT room, time, COUNT(*) n FROM opengym WHERE date=? GROUP BY room, time"
  ).bind(date).all();
  const booked: Record<string, number> = {};
  for (const r of counts as any[]) {
    const s = parseInt(r.time.slice(0, 2), 10) * 60 + parseInt(r.time.slice(3, 5), 10);
    if (s < start + 60 && s + 60 > start) booked[r.room] = (booked[r.room] || 0) + r.n;
  }

  // pick the free room with the most space
  let room: string | null = null, best = 0;
  for (const r of ROOMS) {
    if (blocked.has(r)) continue;
    const left = (CAP[r] || 0) - (booked[r] || 0);
    if (left > best) { best = left; room = r; }
  }
  if (!room) return err("That time is fully booked or in use by a class", 409);

  try {
    await env.DB.prepare("INSERT INTO opengym(date,time,room,name,email,pay_method) VALUES(?,?,?,?,?,?)")
      .bind(date, time, room, name.trim().slice(0, 80), em, pay).run();
  } catch (e: any) {
    if (String(e).includes("UNIQUE")) return err("You already booked this slot", 409);
    throw e;
  }
  return Response.json({ ok: true, spots_left: best - 1 });
};
const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
