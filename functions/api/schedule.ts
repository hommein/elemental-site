interface Env { DB: D1Database }

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const week = url.searchParams.get("week"); // 'YYYY-MM-DD' of a Sunday; defaults to current week
  const base = week ? new Date(week + "T00:00:00Z") : new Date();
  const sunday = new Date(base);
  sunday.setUTCDate(base.getUTCDate() - base.getUTCDay());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday); d.setUTCDate(sunday.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const { results: classes } = await env.DB.prepare(
    "SELECT id,title,instructor,day,time,duration_min,category,pricing,capacity FROM classes WHERE active=1 ORDER BY day,time,sort"
  ).all();
  const { results: counts } = await env.DB.prepare(
    "SELECT class_id,date,COUNT(*) as n FROM signups WHERE date>=? AND date<=? GROUP BY class_id,date"
  ).bind(dates[0], dates[6]).all();
  const countMap: Record<string, number> = {};
  for (const c of counts as any[]) countMap[`${c.class_id}:${c.date}`] = c.n;
  const out = (classes as any[]).map(c => ({
    ...c,
    date: dates[c.day],
    taken: countMap[`${c.id}:${dates[c.day]}`] || 0,
  }));
  return Response.json({ week: dates[0], dates, classes: out }, {
    headers: { "cache-control": "no-store" },
  });
};
