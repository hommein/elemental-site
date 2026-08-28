import { AuthEnv, json, getUser } from "../../_lib";

const gate = async (env: AuthEnv, request: Request) => {
  const u: any = await getUser(env, request);
  return u?.is_admin ? null : json({ error: "Admins only" }, 403);
};

export const onRequestGet: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const g = await gate(env, request); if (g) return g;
  const u = new URL(request.url);
  const class_id = Number(u.searchParams.get("class_id")), date = u.searchParams.get("date");
  if (!class_id || !date) return json({ error: "class_id and date required" }, 400);
  const rows = (await env.DB.prepare(
    "SELECT id,name,email,pay_method,pack_id FROM signups WHERE class_id=?1 AND date=?2 ORDER BY id"
  ).bind(class_id, date).all()).results;
  return json({ signups: rows });
};

export const onRequestPost: PagesFunction<AuthEnv> = async ({ env, request }) => {
  const g = await gate(env, request); if (g) return g;
  let b: any; try { b = await request.json(); } catch { return json({ error: "Invalid JSON" }, 400); }

  if (b.op === "remove") {
    const row: any = await env.DB.prepare("SELECT id,pack_id FROM signups WHERE id=?1").bind(Number(b.id)).first();
    if (!row) return json({ error: "Not found" }, 404);
    await env.DB.prepare("DELETE FROM signups WHERE id=?1").bind(row.id).run();
    if (row.pack_id)
      await env.DB.prepare("UPDATE classpacks SET remaining=MIN(remaining+1,size) WHERE id=?1").bind(row.pack_id).run();
    return json({ ok: true });
  }

  if (b.op === "add") {
    const { class_id, date, name, email } = b;
    const pay = ["pack", "venmo", "cash"].includes(b.pay_method) ? b.pay_method : "cash";
    if (!class_id || !date || !name || !email) return json({ error: "class_id, date, name, email required" }, 400);
    const em = String(email).trim().toLowerCase();
    let packId: number | null = null;
    if (pay === "pack") {
      const usr: any = await env.DB.prepare("SELECT id FROM users WHERE email=?1").bind(em).first();
      const pack: any = usr && await env.DB.prepare(
        "SELECT id FROM classpacks WHERE user_id=?1 AND remaining>0 ORDER BY purchased_at,id LIMIT 1").bind(usr.id).first();
      if (!pack) return json({ error: "No pack with balance for that email" }, 402);
      packId = pack.id;
      await env.DB.prepare("UPDATE classpacks SET remaining=remaining-1 WHERE id=?1").bind(packId).run();
    }
    try {
      await env.DB.prepare("INSERT INTO signups(class_id,date,name,email,pay_method,pack_id) VALUES(?,?,?,?,?,?)")
        .bind(Number(class_id), date, String(name).trim().slice(0, 80), em, pay, packId).run();
    } catch (e: any) {
      if (String(e).includes("UNIQUE")) return json({ error: "Already signed up" }, 409);
      throw e;
    }
    return json({ ok: true });
  }
  return json({ error: "Unknown op" }, 400);
};
