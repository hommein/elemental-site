import { ptEpoch } from "./bookings";
import { getUser } from "../_lib";
interface Env { DB: D1Database; SESSION_SECRET: string }

const METHODS = ["pack", "venmo", "cash", "external"];

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: any;
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }
  const { class_id, date, name, email, pay_method } = body || {};
  if (!class_id || !date || !name || !email) return err("class_id, date, name and email are required", 400);
  if (!METHODS.includes(pay_method)) return err("Please choose how you'll pay: class pack, Venmo, or cash", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("Bad date format", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err("Bad email", 400);
  const em = email.trim().toLowerCase();

  const cls: any = await env.DB.prepare("SELECT * FROM classes WHERE id=? AND active=1").bind(class_id).first();
  if (!cls) return err("Class not found", 404);
  if (cls.category === "selah") return err("This class is booked through Selah Dance", 400);
  const guestExt = cls.pricing === "external";
  if (guestExt && pay_method !== "external") return err("This class is paid directly to the instructor", 400);
  if (!guestExt && pay_method === "external") return err("Pick pack, Venmo, or cash", 400);
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  if (dow !== cls.day) return err("Date does not match this class's weekday", 400);

  if (ptEpoch(date, cls.time) <= Date.now()) {
    const u: any = await getUser(env as any, request);
    if (!u?.is_admin) return err("This class has already started — pick an upcoming one", 400);
  }

  const cnt: any = await env.DB.prepare("SELECT COUNT(*) n FROM signups WHERE class_id=? AND date=?").bind(class_id, date).first();
  if (cnt.n >= cls.capacity) return err("Class is full", 409);

  // resolve a class pack if paying by pack
  let packId: number | null = null;
  let packUid: number | null = null;
  let packLeft: number | null = null;
  if (pay_method === "pack") {
    if (cls.pricing !== "dropin")
      return err(cls.title === "Community Jam"
        ? "Community Jam is $10 like open gym — choose Venmo or cash"
        : "This class is donation-based ($" + (cls.price ?? 12) + " suggested) and isn't covered by class packs — choose Venmo or cash", 400);
    const u: any = await env.DB.prepare("SELECT id FROM users WHERE email=?1").bind(em).first();
    // oldest pack with balance first; otherwise newest pack (balance may go negative
    // — studio records Venmo payments late, so members can book ahead of the update)
    const pack: any = u && (await env.DB.prepare(
      "SELECT id, remaining FROM classpacks WHERE user_id=?1 AND remaining>0 ORDER BY purchased_at ASC, id ASC LIMIT 1"
    ).bind(u.id).first() || await env.DB.prepare(
      "SELECT id, remaining FROM classpacks WHERE user_id=?1 ORDER BY purchased_at DESC, id DESC LIMIT 1"
    ).bind(u.id).first());
    if (!pack) return err(u
      ? "No class pack on your account yet — choose Venmo or cash, or ask the studio to add your pack."
      : "Class packs are tied to an account — sign in with this email first, or choose Venmo or cash.", 402);
    packId = pack.id;
    packUid = u.id;
    packLeft = pack.remaining - 1;
  }

  try {
    await env.DB.prepare("INSERT INTO signups(class_id,date,name,email,pay_method,pack_id) VALUES(?,?,?,?,?,?)")
      .bind(class_id, date, name.trim().slice(0, 80), em, pay_method, packId).run();
  } catch (e: any) {
    if (String(e).includes("UNIQUE")) return err("You are already signed up for this class", 409);
    throw e;
  }
  if (packId != null)
    await env.DB.prepare("UPDATE classpacks SET remaining = remaining-1 WHERE id=?1").bind(packId).run();

  // canonical pack balance = SUM(remaining) across ALL packs — same number everywhere
  if (packUid != null) {
    const bal = await env.DB.prepare("SELECT COALESCE(SUM(remaining),0) b FROM classpacks WHERE user_id=?1").bind(packUid).first<any>();
    packLeft = Number(bal?.b ?? 0);
  }
  return new Response(JSON.stringify({ ok: true, spots_left: cls.capacity - cnt.n - 1, pack_remaining: packLeft }),
    { headers: { "content-type": "application/json", "cache-control": "no-store" } });
};

const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
