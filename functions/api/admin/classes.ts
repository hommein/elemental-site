import { AuthEnv, json, getUser } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u: any = await getUser(env, request);
  return u?.is_admin ? u : null;
}
const FIELDS = ["title","instructor","day","time","duration_min","category","pricing","capacity","active","room","price","on_date"] as const;

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  const r = await env.DB.prepare("SELECT * FROM classes ORDER BY day, time, id").all();
  return json({ classes: r.results });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (b.op === "override") {
    const { class_id, date } = b;
    if (!class_id || !/^\d{4}-\d{2}-\d{2}$/.test(date || "")) return json({ error: "class_id and date required" }, 400);
    const s = b.set || {};
    const vals = [class_id, date, b.cancelled ? 1 : 0,
      s.title ?? null, s.instructor ?? null, s.time ?? null,
      s.duration_min != null ? Number(s.duration_min) : null,
      s.capacity != null ? Number(s.capacity) : null, s.room ?? null];
    if (!b.cancelled && vals.slice(3).every(v => v == null)) {
      await env.DB.prepare("DELETE FROM overrides WHERE class_id=?1 AND date=?2").bind(class_id, date).run();
      return json({ ok: true, cleared: true });
    }
    await env.DB.prepare(`INSERT INTO overrides(class_id,date,cancelled,title,instructor,time,duration_min,capacity,room)
      VALUES(?1,?2,?3,?4,?5,?6,?7,?8,?9) ON CONFLICT(class_id,date) DO UPDATE SET cancelled=?3,title=?4,instructor=?5,time=?6,duration_min=?7,capacity=?8,room=?9`)
      .bind(...vals).run();
    return json({ ok: true });
  }
  if (b.op === "clear_override") {
    await env.DB.prepare("DELETE FROM overrides WHERE class_id=?1 AND date=?2").bind(b.class_id, b.date).run();
    return json({ ok: true });
  }
  if (b.op === "delete") {
    if (!b.id) return json({ error: "id required" }, 400);
    await env.DB.prepare("UPDATE classes SET active = 0 WHERE id = ?1").bind(b.id).run();
    return json({ ok: true });
  }

  const title = String(b.title || "").trim();
  const time = String(b.time || "");
  const day = Number(b.day);
  if (!title) return json({ error: "Title required" }, 400);
  if (!/^\d{2}:\d{2}$/.test(time)) return json({ error: "Time must be HH:MM (24h)" }, 400);
  if (!(day >= 0 && day <= 6)) return json({ error: "Day must be 0-6" }, 400);
  const vals = {
    title, day, time,
    instructor: String(b.instructor || "").trim() || null,
    duration_min: Number(b.duration_min) || 60,
    category: String(b.category || "").trim() || null,
    pricing: String(b.pricing || "").trim() || null,
    capacity: Number(b.capacity) || 8,
    active: b.active === false || b.active === 0 ? 0 : 1,
    room: String(b.room || "Sun Room"),
    price: b.price != null && b.price !== "" ? Number(b.price) : null,
    on_date: /^\d{4}-\d{2}-\d{2}$/.test(String(b.on_date || "")) ? b.on_date : null,
  };
  if (b.id) {
    await env.DB.prepare(`UPDATE classes SET ${FIELDS.map((f, i) => `${f} = ?${i + 1}`).join(", ")} WHERE id = ?${FIELDS.length + 1}`)
      .bind(...FIELDS.map(f => (vals as any)[f]), b.id).run();
    return json({ ok: true, id: b.id });
  }
  const r = await env.DB.prepare(`INSERT INTO classes(${FIELDS.join(",")}) VALUES(${FIELDS.map((_, i) => `?${i + 1}`).join(",")})`)
    .bind(...FIELDS.map(f => (vals as any)[f])).run();
  return json({ ok: true, id: r.meta.last_row_id });
};
