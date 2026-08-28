import { AuthEnv, json, getUser } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u: any = await getUser(env, request);
  return u?.is_admin ? u : null;
}
const FIELDS = ["title","instructor","day","time","duration_min","category","pricing","capacity","active","room"] as const;

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  const r = await env.DB.prepare("SELECT * FROM classes ORDER BY day, time, id").all();
  return json({ classes: r.results });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

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
