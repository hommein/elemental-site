interface Env { DB: D1Database }

const METHODS = ["pack", "venmo", "cash"];

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
  if (cls.pricing === "external") return err("This class is booked through Selah Dance", 400);
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  if (dow !== cls.day) return err("Date does not match this class's weekday", 400);

  const cnt: any = await env.DB.prepare("SELECT COUNT(*) n FROM signups WHERE class_id=? AND date=?").bind(class_id, date).first();
  if (cnt.n >= cls.capacity) return err("Class is full", 409);

  // resolve a class pack if paying by pack
  let packId: number | null = null;
  let packLeft: number | null = null;
  if (pay_method === "pack") {
    const u: any = await env.DB.prepare("SELECT id FROM users WHERE email=?1").bind(em).first();
    const pack: any = u && await env.DB.prepare(
      "SELECT id, remaining FROM classpacks WHERE user_id=?1 AND remaining>0 ORDER BY purchased_at ASC, id ASC LIMIT 1"
    ).bind(u.id).first();
    if (!pack) return err(u
      ? "No class pack with remaining classes on your account — choose Venmo or cash, or ask the studio to add your pack."
      : "Class packs are tied to an account — sign in with this email first, or choose Venmo or cash.", 402);
    packId = pack.id;
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
    await env.DB.prepare("UPDATE classpacks SET remaining = remaining-1 WHERE id=?1 AND remaining>0").bind(packId).run();

  return Response.json({ ok: true, spots_left: cls.capacity - cnt.n - 1, pack_remaining: packLeft });
};

const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
