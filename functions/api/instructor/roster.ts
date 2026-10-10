import { AuthEnv, json, getUser, weekSchedule } from "../../_lib";

const gate = async (env: AuthEnv, request: Request) => {
  const u: any = await getUser(env, request);
  return u?.is_admin || u?.is_instructor ? null : json({ error: "Instructors only" }, 403);
};

/** GET ?date=YYYY-MM-DD → that day's classes with their signups. */
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const g = await gate(env, request); if (g) return g;
  const date = new URL(request.url).searchParams.get("date");
  if (!date || !/^\d{4}-\d{2}-\d{2}$/.test(date)) return json({ error: "date required" }, 400);
  const wk = await weekSchedule(env, date);
  const classes = wk.classes.filter((c: any) => c.date === date);
  const rows = (await env.DB.prepare(
    "SELECT id,class_id,name,email,pay_method,paid,checked_in FROM signups WHERE date=?1 ORDER BY name"
  ).bind(date).all()).results as any[];
  for (const c of classes) c.signups = rows.filter(r => r.class_id === c.id);
  return json({ date, classes });
};

/** POST {op:"checkin", id, on} */
export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const g = await gate(env, request); if (g) return g;
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  if (b.op === "checkin") {
    await env.DB.prepare("UPDATE signups SET checked_in=?2 WHERE id=?1").bind(Number(b.id), b.on ? 1 : 0).run();
    return json({ ok: true });
  }
  return json({ error: "Unknown op" }, 400);
};
