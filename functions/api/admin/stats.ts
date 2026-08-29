import { AuthEnv, json, getUser } from "../../_lib";

// GET /api/admin/stats?weeks=12 -> time-series + breakdowns for admin charts
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const u: any = await getUser(env, request);
  if (!u?.is_admin) return json({ error: "Admin only" }, 403);
  const url = new URL(request.url);
  const nWeeks = Math.min(52, Math.max(4, parseInt(url.searchParams.get("weeks") || "12", 10) || 12));

  // current week's Sunday (UTC), then back nWeeks-1 weeks
  const now = new Date();
  const sun = new Date(Date.UTC(now.getUTCFullYear(), now.getUTCMonth(), now.getUTCDate()));
  sun.setUTCDate(sun.getUTCDate() - sun.getUTCDay());
  const start = new Date(sun); start.setUTCDate(start.getUTCDate() - 7 * (nWeeks - 1));
  const s0 = start.toISOString().slice(0, 10);
  const end = new Date(sun); end.setUTCDate(end.getUTCDate() + 7);
  const e0 = end.toISOString().slice(0, 10);
  const d90 = new Date(sun); d90.setUTCDate(d90.getUTCDate() - 90);
  const s90 = d90.toISOString().slice(0, 10);
  const lo = s0 < s90 ? s0 : s90;

  const D = env.DB;
  const su = (await D.prepare(
    `SELECT s.date, s.pay_method, c.title, c.category, c.instructor, c.day, COALESCE(c.price, CASE WHEN c.title='Community Jam' THEN 10 WHEN c.category IN ('flex','flow') THEN 12 ELSE 30 END) AS price FROM signups s JOIN classes c ON c.id=s.class_id
     WHERE s.date >= ?1 AND s.date < ?2`).bind(lo, e0).all()).results as any[];
  const og = (await D.prepare("SELECT date, time, pay_method FROM opengym WHERE date >= ?1 AND date < ?2").bind(lo, e0).all()).results as any[];
  const pay = (await D.prepare("SELECT date, amount FROM payments WHERE date >= ?1 AND date < ?2").bind(s0, e0).all()).results as any[];
  const usr = (await D.prepare("SELECT substr(created_at,1,10) AS d FROM users WHERE created_at >= ?1").bind(s0).all()).results as any[];
  // packs SOLD = money in (payments.pack_credits), not classpack bookkeeping rows
  const pk = (await D.prepare("SELECT date AS d, pack_credits FROM payments WHERE pack_credits > 0 AND date >= ?1").bind(s0).all()).results as any[];

  const wkOf = (d: string) => {
    const t = new Date(d + "T00:00:00Z");
    const i = Math.floor((t.getTime() - start.getTime()) / (7 * 864e5));
    return i >= 0 && i < nWeeks ? i : -1;
  };
  const weeks = Array.from({ length: nWeeks }, (_, i) => {
    const d = new Date(start); d.setUTCDate(d.getUTCDate() + 7 * i);
    return { week: d.toISOString().slice(0, 10), signups: 0, opengym: 0, revenue: 0, new_users: 0, packs: 0 };
  });
  const bump = (d: string, k: string, v = 1) => { const i = wkOf(d); if (i >= 0) (weeks[i] as any)[k] += v; };

  const GUESTS = new Set(["Bethany", "Mel", "Daniel", "Kelsey"]);
  const groupOf = (c: any) => c.category === "selah" ? "selah"
    : c.title === "Community Jam" ? "jam" : c.category === "flex" ? "flex"
    : c.title === "Belly Dance" || (c.instructor && GUESTS.has(c.instructor)) ? "guest" : "aerial";
  const topMap: Record<string, number> = {}, topGrp: Record<string, string> = {}, catMap: Record<string, number> = {},
    payMix: Record<string, number> = {}, byDay = Array.from({ length: 7 }, () => ({ cls: 0, og: 0 }));
  for (const s of su) {
    if (s.title === "Community Jam") { // treated as open gym
      bump(s.date, "opengym");
      if (s.date >= s90) {
        byDay[new Date(s.date + "T00:00:00Z").getUTCDay()].og++;
        payMix[s.pay_method || "unset"] = (payMix[s.pay_method || "unset"] || 0) + 10;
      }
      continue;
    }
    bump(s.date, "signups");
    if (s.date >= s90) {
      topMap[s.title] = (topMap[s.title] || 0) + 1;
      topGrp[s.title] = groupOf(s);
      catMap[groupOf(s)] = (catMap[groupOf(s)] || 0) + 1;
      const v = s.pay_method === "pack" ? 27.5 : s.price;   // $ value, not count
      payMix[s.pay_method || "unset"] = (payMix[s.pay_method || "unset"] || 0) + v;
      byDay[new Date(s.date + "T00:00:00Z").getUTCDay()].cls++;
    }
  }
  const ogHour: Record<string, number> = {};
  for (const o of og) {
    bump(o.date, "opengym");
    if (o.date >= s90) {
      byDay[new Date(o.date + "T00:00:00Z").getUTCDay()].og++;
      ogHour[o.time] = (ogHour[o.time] || 0) + 1;
      payMix[o.pay_method || "unset"] = (payMix[o.pay_method || "unset"] || 0) + 10;
    }
  }
  for (const p of pay) bump(p.date, "revenue", p.amount || 0);
  for (const x of usr) bump(x.d, "new_users");
  for (const x of pk) bump(x.d, "packs", x.pack_credits / 4);

  const topClasses = Object.entries(topMap).map(([title, n]) => ({ title, n, group: topGrp[title] }))
    .sort((a, b) => b.n - a.n).slice(0, 8);
  return json({ start: s0, weeks, topClasses, byCat: catMap, payMix, byDay, ogHour });
};
