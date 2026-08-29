import { AuthEnv, json, getUser, priceOf } from "../../_lib";

async function admin(env: AuthEnv, request: Request) {
  const u: any = await getUser(env, request);
  return u?.is_admin ? u : null;
}


const PRICE = priceOf;
async function unpaidItems(D: D1Database, email: string) {
  const em = email.toLowerCase();
  const og = (await D.prepare("SELECT id,date,time FROM opengym WHERE lower(email)=?1 AND paid=0 AND (pay_method IS NULL OR pay_method NOT IN ('pack','membership','waived'))").bind(em)
    .all()).results.map((r: any) => ({ ...r, kind: "opengym", title: "Open Gym" }));
  const cl = (await D.prepare(`SELECT s.id, s.date, c.time, c.title, c.category, c.price FROM signups s JOIN classes c ON c.id=s.class_id
    WHERE lower(s.email)=?1 AND s.paid=0 AND (s.pay_method IS NULL OR s.pay_method NOT IN ('pack','external','membership','waived')) AND c.pricing != 'external'`).bind(em)
    .all()).results.map((r: any) => ({ ...r, kind: "signups" }));
  return [...og, ...cl].map((r: any) => ({ ...r, price: r.price ?? PRICE(r) }))
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

  const users = (await env.DB.prepare(`SELECT id,name,email,phone,created_at,
    (SELECT max(end_date) FROM memberships m WHERE m.user_id=users.id) AS member_until
    FROM users ORDER BY name`).all()).results as any[];
  const su = (await env.DB.prepare(
    `SELECT s.id, s.paid, s.email, s.date, s.pay_method, c.title, c.time, c.category, c.instructor, COALESCE(c.price, CASE WHEN c.title='Community Jam' THEN 10 WHEN c.category IN ('flex','flow') THEN 12 ELSE 30 END) AS price, c.pricing FROM signups s JOIN classes c ON c.id=s.class_id
     WHERE s.date >= ?1 AND s.date < ?2 ORDER BY s.date, c.time`).bind(week, weekEnd).all()).results as any[];
  const og = (await env.DB.prepare(
    "SELECT id, paid, email, date, time, pay_method, 10 AS price FROM opengym WHERE date >= ?1 AND date < ?2").bind(week, weekEnd).all()).results as any[];
  const packs = (await env.DB.prepare("SELECT * FROM classpacks ORDER BY purchased_at DESC, id DESC").all()).results as any[];
  const pays = (await env.DB.prepare("SELECT * FROM payments ORDER BY date DESC, id DESC").all()).results as any[];
  const membs = (await env.DB.prepare("SELECT * FROM memberships ORDER BY end_date DESC, id DESC").all()).results as any[];

  const byEmail: Record<string, any> = {};
  for (const u of users) byEmail[u.email.toLowerCase()] = { ...u, classes: [], opengym: [], packs: [], payments: [], memberships: [] };
  const guest = (e: string) => byEmail[e] || (byEmail[e] = { id: null, name: "(no account)", email: e, classes: [], opengym: [], packs: [], payments: [], memberships: [] });
  for (const s of su) guest(s.email.toLowerCase()).classes.push({ id: s.id, paid: s.paid, date: s.date, title: s.title, time: s.time, pay_method: s.pay_method, category: s.category, instructor: s.instructor, billable: s.pay_method !== "pack" && s.pay_method !== "external" && s.pay_method !== "membership" && s.pay_method !== "waived" && s.pricing !== "external" ? 1 : 0 });
  for (const o of og) guest(o.email.toLowerCase()).opengym.push({ id: o.id, paid: o.paid, date: o.date, time: o.time, pay_method: o.pay_method, billable: o.pay_method !== "pack" && o.pay_method !== "membership" && o.pay_method !== "waived" ? 1 : 0 });
  for (const p of packs) { const u = users.find(u => u.id === p.user_id); if (u) byEmail[u.email.toLowerCase()].packs.push(p); }
  for (const p of pays) { const u = users.find(u => u.id === p.user_id); if (u) byEmail[u.email.toLowerCase()].payments.push(p); }
  for (const m of membs) { const u = users.find(u => u.id === m.user_id); if (u) byEmail[u.email.toLowerCase()].memberships.push(m); }

  const crs = (await env.DB.prepare("SELECT user_id, SUM(unallocated) c FROM payments GROUP BY user_id").all()).results as any[];
  for (const c of crs) { const u = users.find(u => u.id === c.user_id); if (u) byEmail[u.email.toLowerCase()].credit = c.c || 0; }
  const people = Object.values(byEmail).filter((p: any) =>
    p.classes.length || p.opengym.length || p.packs.length || p.payments.length || p.id);
  return json({ week, people });
};

// POST ops: add_pack {user_id,size}, adjust_pack {id,delta}, delete_pack {id}, add_payment {user_id,amount,method,note,date?}, delete_payment {id}
export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  if (!await admin(env, request)) return json({ error: "Admin only" }, 403);
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }
  const D = env.DB;
  const D_RE = /^\d{4}-\d{2}-\d{2}$/;
  if (b.op === "mark_paid") {
    const tbl = b.kind === "opengym" ? "opengym" : "signups";
    const row: any = tbl === "opengym"
      ? await D.prepare("SELECT id, paid, email, 10 AS price, pay_method FROM opengym WHERE id=?1").bind(Number(b.id)).first()
      : await D.prepare(`SELECT s.id, s.paid, s.email, s.pay_method, c.pricing, COALESCE(c.price, CASE WHEN c.title='Community Jam' THEN 10 WHEN c.category IN ('flex','flow') THEN 12 ELSE 30 END) AS price
           FROM signups s JOIN classes c ON c.id=s.class_id WHERE s.id=?1`).bind(Number(b.id)).first();
    if (!row) return json({ error: "Booking not found" }, 404);
    const billable = row.pay_method !== "pack" && row.pay_method !== "external" && row.pay_method !== "membership" && row.pay_method !== "waived" && row.pricing !== "external";
    const usr: any = billable ? await D.prepare("SELECT id FROM users WHERE lower(email)=?1").bind(row.email.toLowerCase()).first() : null;
    if (!b.paid) {
      if (!row.paid) return json({ ok: true, noop: true });
      await D.prepare(`UPDATE ${tbl} SET paid=0 WHERE id=?1`).bind(Number(b.id)).run();
      // give the credit back so re-marking paid doesn't double-charge
      if (usr) await D.prepare("UPDATE payments SET unallocated = unallocated + ?2 WHERE id = (SELECT MAX(id) FROM payments WHERE user_id=?1)").bind(usr.id, row.price).run();
      return json({ ok: true });
    }
    if (row.paid) return json({ ok: true, noop: true });
    let credit_used = 0;
    if (billable) {
      // dummy-proof: paid means the money was tracked — requires enough credit on file
      const cr = usr ? Number((await D.prepare("SELECT COALESCE(SUM(unallocated),0) c FROM payments WHERE user_id=?1").bind(usr.id).first<any>())?.c || 0) : 0;
      if (!usr || cr < row.price)
        return json({ error: `Can't mark paid: $${cr.toFixed(2)} credit on file, $${row.price} needed. Record the payment first (+ payment $ field)${usr ? "" : " — no account for this email"}, or waive it if it's a trade/comp.` }, 409);
      let left = row.price;
      const rows = (await D.prepare("SELECT id, unallocated FROM payments WHERE user_id=?1 AND unallocated>0 ORDER BY id").bind(usr.id).all()).results as any[];
      for (const r of rows) {
        if (left <= 0) break;
        const take = Math.min(r.unallocated, left);
        await D.prepare("UPDATE payments SET unallocated = unallocated - ?2 WHERE id=?1").bind(r.id, take).run();
        left -= take; credit_used += take;
      }
    }
    await D.prepare(`UPDATE ${tbl} SET paid=1 WHERE id=?1`).bind(Number(b.id)).run();
    return json({ ok: true, credit_used });
  }
  if (b.op === "waive") {
    const tbl = b.kind === "opengym" ? "opengym" : "signups";
    if (b.on) await D.prepare(`UPDATE ${tbl} SET pay_method='waived', paid=1 WHERE id=?1`).bind(Number(b.id)).run();
    else await D.prepare(`UPDATE ${tbl} SET pay_method='venmo', paid=0 WHERE id=?1`).bind(Number(b.id)).run();
    return json({ ok: true });
  }
  if (b.op === "add_membership") {
    // one month from start (default today PT), $100, records the payment too
    const start = D_RE.test(b.start || "") ? b.start : new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10);
    const d = new Date(start + "T00:00:00Z"); d.setUTCMonth(d.getUTCMonth() + 1); d.setUTCDate(d.getUTCDate() - 1);
    const end = d.toISOString().slice(0, 10);
    const method = ["venmo", "cash", "waived"].includes(b.method) ? b.method : "venmo";
    await D.prepare("INSERT INTO memberships(user_id,start_date,end_date,price) VALUES(?,?,?,?)").bind(b.user_id, start, end, method === "waived" ? 0 : 100).run();
    if (method !== "waived") await D.prepare("INSERT INTO payments(user_id,date,amount,method,note) VALUES(?,?,100,?,?)")
      .bind(b.user_id, start, method, `open gym membership ${start} → ${end}`).run();
    return json({ ok: true, start, end });
  }
  if (b.op === "delete_membership") {
    await D.prepare("DELETE FROM memberships WHERE id=?1").bind(b.id).run();
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
    if (!b.user_id || !(b.amount >= 0)) return json({ error: "user_id + amount" }, 400);
    const usr = await D.prepare("SELECT email FROM users WHERE id=?1").bind(b.user_id).first<any>();
    const items = usr?.email ? await unpaidItems(D, usr.email) : [];
    const cr = await D.prepare("SELECT COALESCE(SUM(unallocated),0) c FROM payments WHERE user_id=?1").bind(b.user_id).first<any>();
    const credit = Number(cr?.c || 0);
    let pool = Number(b.amount) + credit;
    const nPacks = Math.floor(pool / 110);
    const credits = nPacks * 4; pool -= nPacks * 110;
    const out = items.map((it: any) => {
      const cover = pool >= it.price;
      if (cover) pool -= it.price;
      return { kind: it.kind, id: it.id, date: it.date, time: it.time, title: it.title, price: it.price, cover };
    });
    return json({ credits, items: out, leftover: pool, credit });
  } else if (b.op === "add_payment") {
    if (!b.user_id || !(b.amount > 0)) return json({ error: "user_id + amount" }, 400);
    await D.prepare("INSERT INTO payments (user_id,amount,method,note,date) VALUES (?1,?2,?3,?4,COALESCE(?5,date('now')))")
      .bind(b.user_id, b.amount, b.method || "venmo", b.note || null, b.date || null).run();
    const crRow = await D.prepare("SELECT COALESCE(SUM(unallocated),0) c FROM payments WHERE user_id=?1").bind(b.user_id).first<any>();
    const prevCredit = Number(crRow?.c || 0);
    let credits = 0, settled = 0, spent = 0, pool = Number(b.amount) + prevCredit;
    const addCredits = async (n: number) => {
      if (!(n > 0)) return;
      const newest = await D.prepare("SELECT id FROM classpacks WHERE user_id=?1 ORDER BY id DESC LIMIT 1").bind(b.user_id).first<any>();
      if (newest) await D.prepare("UPDATE classpacks SET remaining = remaining + ?2 WHERE id=?1").bind(newest.id, n).run();
      else await D.prepare("INSERT INTO classpacks (user_id,size,remaining,note) VALUES (?1,?2,?2,'auto: payment')").bind(b.user_id, n).run();
    };
    const usr = await D.prepare("SELECT email FROM users WHERE id=?1").bind(b.user_id).first<any>();
    if (b.plan) {
      // admin-confirmed distribution: apply exactly what was approved
      credits = Math.max(0, b.plan.credits | 0);
      await addCredits(credits);
      spent += credits * 27.5;
      const priced = usr?.email ? await unpaidItems(D, usr.email) : [];
      for (const it of (b.plan.settle || [])) {
        if (it.kind !== "signups" && it.kind !== "opengym") continue;
        await D.prepare(`UPDATE ${it.kind} SET paid=1 WHERE id=?1`).bind(it.id).run();
        spent += priced.find((x: any) => x.kind === it.kind && x.id === it.id)?.price || 0;
        settled++;
      }
      pool = Math.max(0, Number(b.amount) + prevCredit - spent);
    } else {
      // auto-settle: $110 chunks buy 4 pack credits; the rest pays off unpaid bookings oldest-first
      const nPacks = Math.floor(pool / 110);
      if (nPacks > 0) { pool -= nPacks * 110; credits = nPacks * 4; await addCredits(credits); }
      if (usr?.email && pool > 0) {
        for (const it of await unpaidItems(D, usr.email)) {
          if (pool < it.price) continue;
          await D.prepare(`UPDATE ${it.kind} SET paid=1 WHERE id=?1`).bind(it.id).run();
          pool -= it.price; settled++;
        }
      }
    }
    // consolidate credit-on-file onto this newest payment
    await D.prepare("UPDATE payments SET unallocated=0 WHERE user_id=?1").bind(b.user_id).run();
    const newPay = await D.prepare("SELECT id FROM payments WHERE user_id=?1 ORDER BY id DESC LIMIT 1").bind(b.user_id).first<any>();
    if (newPay) await D.prepare("UPDATE payments SET unallocated=?2 WHERE id=?1").bind(newPay.id, pool).run();
    return json({ ok: true, credits_added: credits, bookings_settled: settled, leftover: pool });
  } else if (b.op === "apply_credit") {
    // mark admin-confirmed bookings paid, draining credit-on-file (oldest payments first)
    if (!b.user_id) return json({ error: "user_id" }, 400);
    const usr = await D.prepare("SELECT email FROM users WHERE id=?1").bind(b.user_id).first<any>();
    const priced = usr?.email ? await unpaidItems(D, usr.email) : [];
    let total = 0, settled = 0;
    for (const it of (b.settle || [])) {
      const m = priced.find((x: any) => x.kind === it.kind && x.id === it.id);
      if (!m) continue;
      await D.prepare(`UPDATE ${m.kind} SET paid=1 WHERE id=?1`).bind(m.id).run();
      total += m.price; settled++;
    }
    let left = total;
    const rows = (await D.prepare("SELECT id, unallocated FROM payments WHERE user_id=?1 AND unallocated>0 ORDER BY id").bind(b.user_id).all()).results as any[];
    for (const r of rows) {
      if (left <= 0) break;
      const take = Math.min(r.unallocated, left);
      await D.prepare("UPDATE payments SET unallocated = unallocated - ?2 WHERE id=?1").bind(r.id, take).run();
      left -= take;
    }
    return json({ ok: true, settled, credit_used: total - left });
  } else if (b.op === "edit_payment") {
    await D.prepare("UPDATE payments SET amount=COALESCE(?2,amount), method=COALESCE(?3,method), date=COALESCE(?4,date), note=COALESCE(?5,note) WHERE id=?1")
      .bind(b.id, b.amount ?? null, b.method ?? null, b.date ?? null, b.note ?? null).run();
  } else if (b.op === "delete_payment") {
    await D.prepare("DELETE FROM payments WHERE id=?1").bind(b.id).run();
  } else return json({ error: "unknown op" }, 400);
  return json({ ok: true });
};
