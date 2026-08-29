import { AuthEnv, json, getUser } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u: any = await getUser(env, request);
  return u?.is_admin ? u : null;
}


const PRICE = (r: any) => r.kind === "opengym" ? 10 : r.title === "Community Jam" ? 10 : (r.category === "flex" || r.category === "flow") ? 12 : 30;
async function unpaidItems(D: D1Database, email: string) {
  const em = email.toLowerCase();
  const og = (await D.prepare("SELECT id,date,time FROM opengym WHERE lower(email)=?1 AND paid=0 AND pay_method!='pack'").bind(em)
    .all()).results.map((r: any) => ({ ...r, kind: "opengym", title: "Open Gym" }));
  const cl = (await D.prepare(`SELECT s.id, s.date, c.time, c.title, c.category FROM signups s JOIN classes c ON c.id=s.class_id
    WHERE lower(s.email)=?1 AND s.paid=0 AND s.pay_method!='pack'`).bind(em)
    .all()).results.map((r: any) => ({ ...r, kind: "signups" }));
  return [...og, ...cl].map((r: any) => ({ ...r, price: PRICE(r) }))
    .sort((a, b) => (a.date + a.time).localeCompare(b.date + b.time));
}

// GET /api/admin/people?week=YYYY-MM-DD (a Sunday) -> users + week activity + packs + payments
export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  const url = new URL(request.url);
  const D = /^\d{4}-\d{2}-\d{2}$/;
  let week = url.searchParams.get("start") || url.searchParams.get("week") || "";
  let weekEnd = url.searchParams.get("end") || "";
  if (!D.test(week)) return json({ error: "start/week=YYYY-MM-DD required" }, 400);
  if (!D.test(weekEnd)) {
    const end = new Date(week + "T00:00:00Z"); end.setUTCDate(end.getUTCDate() + 7);
    weekEnd = end.toISOString().slice(0, 10);
  }

  const users = (await env.DB.prepare("SELECT id,name,email,phone,created_at FROM users ORDER BY name").all()).results as any[];
  const su = (await env.DB.prepare(
    `SELECT s.id, s.paid, s.email, s.date, s.pay_method, c.title, c.time, c.category, c.instructor FROM signups s JOIN classes c ON c.id=s.class_id
     WHERE s.date >= ?1 AND s.date < ?2 ORDER BY s.date, c.time`).bind(week, weekEnd).all()).results as any[];
  const og = (await env.DB.prepare(
    "SELECT id, paid, email, date, time, pay_method FROM opengym WHERE date >= ?1 AND date < ?2").bind(week, weekEnd).all()).results as any[];
  const packs = (await env.DB.prepare("SELECT * FROM classpacks ORDER BY purchased_at DESC, id DESC").all()).results as any[];
  const pays = (await env.DB.prepare("SELECT * FROM payments WHERE date >= date('now','-90 days') ORDER BY date DESC, id DESC").all()).results as any[];

  const byEmail: Record<string, any> = {};
  for (const u of users) byEmail[u.email.toLowerCase()] = { ...u, classes: [], opengym: [], packs: [], payments: [] };
  const guest = (e: string) => byEmail[e] || (byEmail[e] = { id: null, name: "(no account)", email: e, classes: [], opengym: [], packs: [], payments: [] });
  for (const s of su) guest(s.email.toLowerCase()).classes.push({ id: s.id, paid: s.paid, date: s.date, title: s.title, time: s.time, pay_method: s.pay_method, category: s.category, instructor: s.instructor });
  for (const o of og) guest(o.email.toLowerCase()).opengym.push({ id: o.id, paid: o.paid, date: o.date, time: o.time, pay_method: o.pay_method });
  for (const p of packs) { const u = users.find(u => u.id === p.user_id); if (u) byEmail[u.email.toLowerCase()].packs.push(p); }
  for (const p of pays) { const u = users.find(u => u.id === p.user_id); if (u) byEmail[u.email.toLowerCase()].payments.push(p); }

  const people = Object.values(byEmail).filter((p: any) =>
    p.classes.length || p.opengym.length || p.packs.length || p.payments.length || p.id);
  return json({ week, people });
};

// POST ops: add_pack {user_id,size}, adjust_pack {id,delta}, delete_pack {id}, add_payment {user_id,amount,method,note,date?}, delete_payment {id}
export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const D = env.DB;
  if (b.op === "mark_paid") {
    const tbl = b.kind === "opengym" ? "opengym" : "signups";
    await env.DB.prepare(`UPDATE ${tbl} SET paid=?1 WHERE id=?2`).bind(b.paid ? 1 : 0, Number(b.id)).run();
    return json({ ok: true });
  }
  if (b.op === "add_pack") {
    if (!b.user_id || !(b.size > 0)) return json({ error: "user_id + size" }, 400);
    await D.prepare("INSERT INTO classpacks (user_id,size,remaining,note) VALUES (?1,?2,?2,?3)").bind(b.user_id, b.size, b.note || null).run();
  } else if (b.op === "adjust_pack") {
    await D.prepare("UPDATE classpacks SET remaining = remaining + ?2 WHERE id=?1").bind(b.id, b.delta | 0).run();
  } else if (b.op === "delete_pack") {
    await D.prepare("DELETE FROM classpacks WHERE id=?1").bind(b.id).run();
  } else if (b.op === "preview_payment") {
    if (!b.user_id || !(b.amount > 0)) return json({ error: "user_id + amount" }, 400);
    const usr = await D.prepare("SELECT email FROM users WHERE id=?1").bind(b.user_id).first<any>();
    const items = usr?.email ? await unpaidItems(D, usr.email) : [];
    let pool = Number(b.amount);
    const nPacks = Math.floor(pool / 110);
    const credits = nPacks * 4; pool -= nPacks * 110;
    const out = items.map((it: any) => {
      const cover = pool >= it.price;
      if (cover) pool -= it.price;
      return { kind: it.kind, id: it.id, date: it.date, time: it.time, title: it.title, price: it.price, cover };
    });
    return json({ credits, items: out, leftover: pool });
  } else if (b.op === "add_payment") {
    if (!b.user_id || !(b.amount > 0)) return json({ error: "user_id + amount" }, 400);
    await D.prepare("INSERT INTO payments (user_id,amount,method,note,date) VALUES (?1,?2,?3,?4,COALESCE(?5,date('now')))")
      .bind(b.user_id, b.amount, b.method || "venmo", b.note || null, b.date || null).run();
    let credits = 0, settled = 0, pool = Number(b.amount);
    const addCredits = async (n: number) => {
      if (!(n > 0)) return;
      const newest = await D.prepare("SELECT id FROM classpacks WHERE user_id=?1 ORDER BY id DESC LIMIT 1").bind(b.user_id).first<any>();
      if (newest) await D.prepare("UPDATE classpacks SET remaining = remaining + ?2 WHERE id=?1").bind(newest.id, n).run();
      else await D.prepare("INSERT INTO classpacks (user_id,size,remaining,note) VALUES (?1,?2,?2,'auto: payment')").bind(b.user_id, n).run();
    };
    if (b.plan) {
      // admin-confirmed distribution: apply exactly what was approved
      credits = Math.max(0, b.plan.credits | 0);
      await addCredits(credits);
      for (const it of (b.plan.settle || [])) {
        if (it.kind !== "signups" && it.kind !== "opengym") continue;
        await D.prepare(`UPDATE ${it.kind} SET paid=1 WHERE id=?1`).bind(it.id).run();
        settled++;
      }
      pool = 0;
    } else {
      // auto-settle: $110 chunks buy 4 pack credits; the rest pays off unpaid bookings oldest-first
      const nPacks = Math.floor(pool / 110);
      if (nPacks > 0) { pool -= nPacks * 110; credits = nPacks * 4; await addCredits(credits); }
      const usr = await D.prepare("SELECT email FROM users WHERE id=?1").bind(b.user_id).first<any>();
      if (usr?.email && pool > 0) {
        for (const it of await unpaidItems(D, usr.email)) {
          if (pool < it.price) continue;
          await D.prepare(`UPDATE ${it.kind} SET paid=1 WHERE id=?1`).bind(it.id).run();
          pool -= it.price; settled++;
        }
      }
    }
    return json({ ok: true, credits_added: credits, bookings_settled: settled, leftover: pool });
  } else if (b.op === "edit_payment") {
    await D.prepare("UPDATE payments SET amount=COALESCE(?2,amount), method=COALESCE(?3,method), date=COALESCE(?4,date), note=COALESCE(?5,note) WHERE id=?1")
      .bind(b.id, b.amount ?? null, b.method ?? null, b.date ?? null, b.note ?? null).run();
  } else if (b.op === "delete_payment") {
    await D.prepare("DELETE FROM payments WHERE id=?1").bind(b.id).run();
  } else return json({ error: "unknown op" }, 400);
  return json({ ok: true });
};
