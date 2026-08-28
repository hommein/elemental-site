import { ptEpoch, CUTOFF_MS } from "./bookings";
interface Env { DB: D1Database }
const json = (o: any, s = 200) => new Response(JSON.stringify(o), { status: s, headers: { "content-type": "application/json" } });

export const onRequestPost: PagesFunction<Env> = async ({ env, request }) => {
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const kind = b?.kind, id = Number(b?.id), email = String(b?.email || "").trim().toLowerCase();
  if (!["class", "opengym"].includes(kind) || !id || !email) return json({ error: "kind, id, email required" }, 400);

  const row: any = kind === "class"
    ? await env.DB.prepare("SELECT s.id, s.date, s.pack_id, c.time FROM signups s JOIN classes c ON c.id = s.class_id WHERE s.id = ?1 AND s.email = ?2").bind(id, email).first()
    : await env.DB.prepare("SELECT id, date, time FROM opengym WHERE id = ?1 AND email = ?2").bind(id, email).first();
  if (!row) return json({ error: "Booking not found for that email" }, 404);

  if (ptEpoch(row.date, row.time) - Date.now() < CUTOFF_MS)
    return json({ error: "Bookings can only be cancelled at least 12 hours before the session" }, 403);

  await env.DB.prepare(`DELETE FROM ${kind === "class" ? "signups" : "opengym"} WHERE id = ?1`).bind(id).run();
  if (kind === "class" && row.pack_id)
    await env.DB.prepare("UPDATE classpacks SET remaining = MIN(remaining+1, size) WHERE id = ?1").bind(row.pack_id).run();
  return json({ ok: true });
};
