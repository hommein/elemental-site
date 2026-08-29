interface Env { DB: D1Database }

export const onRequestGet: PagesFunction<Env> = async ({ env, request }) => {
  const url = new URL(request.url);
  const week = url.searchParams.get("week");
  const base = week ? new Date(week + "T00:00:00Z") : new Date();
  const sunday = new Date(base);
  sunday.setUTCDate(base.getUTCDate() - base.getUTCDay());
  const dates: string[] = [];
  for (let i = 0; i < 7; i++) {
    const d = new Date(sunday); d.setUTCDate(sunday.getUTCDate() + i);
    dates.push(d.toISOString().slice(0, 10));
  }
  const { results: classes } = await env.DB.prepare(
    "SELECT id,title,instructor,day,time,duration_min,category,pricing,capacity,room,price,pay_note,on_date FROM classes WHERE active=1 ORDER BY day,time,sort"
  ).all();
  const { results: counts } = await env.DB.prepare(
    "SELECT class_id,date,COUNT(*) n FROM signups WHERE date>=? AND date<=? GROUP BY class_id,date"
  ).bind(dates[0], dates[6]).all();
  const cm: Record<string, number> = {};
  for (const c of counts as any[]) cm[`${c.class_id}:${c.date}`] = c.n;
  const { results: og } = await env.DB.prepare(
    "SELECT date,time,room,COUNT(*) n FROM opengym WHERE date>=? AND date<=? GROUP BY date,time,room"
  ).bind(dates[0], dates[6]).all();
  const { results: ovs } = await env.DB.prepare(
    "SELECT * FROM overrides WHERE date>=? AND date<=?"
  ).bind(dates[0], dates[6]).all();
  const om: Record<number, any> = {};
  for (const o of ovs as any[]) om[o.class_id] = o;
  const OVF = ["title", "instructor", "time", "duration_min", "capacity", "room"] as const;
  const out = (classes as any[])
    .filter(c => !c.on_date || c.on_date === dates[c.day])
    .map(c => {
      const row: any = { ...c, date: dates[c.day], one_off: c.on_date ? 1 : 0, cancelled: 0, modified: 0 };
      const o = om[c.id];
      if (o) {
        row.cancelled = o.cancelled ? 1 : 0;
        for (const f of OVF) if (o[f] != null && o[f] !== "") { row[f] = o[f]; row.modified = 1; }
      }
      row.taken = cm[`${c.id}:${row.date}`] || 0;
      return row;
    });
  return Response.json({ week: dates[0], dates, classes: out, opengym: og }, {
    headers: { "cache-control": "no-store" },
  });
};
