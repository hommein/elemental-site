interface Env { DB: D1Database }

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let body: any;
  try { body = await request.json(); } catch { return err("Invalid JSON", 400); }
  const { class_id, date, name, email } = body || {};
  if (!class_id || !date || !name || !email) return err("class_id, date, name and email are required", 400);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(date)) return err("Bad date format", 400);
  if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email)) return err("Bad email", 400);

  const cls: any = await env.DB.prepare("SELECT * FROM classes WHERE id=? AND active=1").bind(class_id).first();
  if (!cls) return err("Class not found", 404);
  if (cls.pricing === "external") return err("This class is booked through Selah Dance", 400);
  const dow = new Date(date + "T00:00:00Z").getUTCDay();
  if (dow !== cls.day) return err("Date does not match this class's weekday", 400);

  const cnt: any = await env.DB.prepare("SELECT COUNT(*) n FROM signups WHERE class_id=? AND date=?").bind(class_id, date).first();
  if (cnt.n >= cls.capacity) return err("Class is full", 409);

  try {
    await env.DB.prepare("INSERT INTO signups(class_id,date,name,email) VALUES(?,?,?,?)")
      .bind(class_id, date, name.trim().slice(0, 80), email.trim().toLowerCase()).run();
  } catch (e: any) {
    if (String(e).includes("UNIQUE")) return err("You are already signed up for this class", 409);
    throw e;
  }
  return Response.json({ ok: true, spots_left: cls.capacity - cnt.n - 1 });
};

const err = (m: string, s: number) => Response.json({ error: m }, { status: s });
