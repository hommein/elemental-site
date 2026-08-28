import { useEffect, useState } from "react";
import { me } from "../lib/user";

type Cls = { id?: number; title: string; instructor: string | null; day: number; time: string;
  duration_min: number; category: string | null; pricing: string | null; capacity: number; active: number; room: string };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BLANK: Cls = { title: "", instructor: "", day: 1, time: "09:00", duration_min: 60, category: "", pricing: "", capacity: 8, active: 1, room: "Sun Room" };

function ScheduleTab() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [rows, setRows] = useState<Cls[]>([]);
  const [edit, setEdit] = useState<Cls | null>(null);
  const [msg, setMsg] = useState("");
  const [showInactive, setShowInactive] = useState(false);

  async function load() {
    const r = await fetch("/api/admin/classes");
    if (!r.ok) { setOk(false); return; }
    setRows((await r.json()).classes); setOk(true);
  }
  useEffect(() => { me().then(u => u?.is_admin ? load() : setOk(false)); }, []);

  async function save(e: React.FormEvent) {
    e.preventDefault(); if (!edit) return;
    const r = await fetch("/api/admin/classes", { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify(edit) });
    const j = await r.json();
    if (!r.ok) { setMsg(j.error || "Save failed"); return; }
    setEdit(null); setMsg("Saved."); load();
  }
  async function del(id: number) {
    if (!confirm("Deactivate this class? Existing signups stay in the database.")) return;
    await fetch("/api/admin/classes", { method: "POST",
      headers: { "content-type": "application/json" }, body: JSON.stringify({ op: "delete", id }) });
    load();
  }

  if (ok === null) return <section className="container py-12"><p>Loading…</p></section>;
  if (!ok) return <section className="container py-12"><p>Admins only — <a className="underline" href="/account">sign in</a> with an admin account.</p></section>;

  const shown = rows.filter(r => showInactive || r.active);
  const inp = "border border-black/20 rounded px-2 py-1 w-full";
  const F = (label: string, el: React.ReactNode) => (
    <label className="flex flex-col gap-1 text-sm"><span className="text-ea-espresso/60">{label}</span>{el}</label>);

  return (
    <section className="container py-12">
      <div className="flex items-center justify-between mb-6 flex-wrap gap-3">
        <h1 className="font-serif text-4xl">Schedule Admin</h1>
        <div className="flex gap-3 items-center">
          <label className="text-sm flex gap-1 items-center">
            <input type="checkbox" checked={showInactive} onChange={e => setShowInactive(e.target.checked)} /> show inactive
          </label>
          <button className="btn btn--accent" onClick={() => { setEdit({ ...BLANK }); setMsg(""); }}>+ New Class</button>
        </div>
      </div>
      {msg && <p className="mb-4 text-ea-brown">{msg}</p>}

      {edit && (
        <form onSubmit={save} className="border border-black/15 rounded-xl p-4 mb-8 grid grid-cols-2 md:grid-cols-4 gap-3 bg-ea-cream/30">
          <div className="col-span-2">{F("Title", <input required className={inp} value={edit.title} onChange={e => setEdit({ ...edit, title: e.target.value })} />)}</div>
          {F("Instructor", <input className={inp} value={edit.instructor || ""} onChange={e => setEdit({ ...edit, instructor: e.target.value })} />)}
          {F("Day", <select className={inp} value={edit.day} onChange={e => setEdit({ ...edit, day: Number(e.target.value) })}>
            {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>)}
          {F("Start (24h HH:MM)", <input required pattern="\\d{2}:\\d{2}" className={inp} value={edit.time} onChange={e => setEdit({ ...edit, time: e.target.value })} />)}
          {F("Minutes", <input type="number" min={15} step={15} className={inp} value={edit.duration_min} onChange={e => setEdit({ ...edit, duration_min: Number(e.target.value) })} />)}
          {F("Capacity", <input type="number" min={1} className={inp} value={edit.capacity} onChange={e => setEdit({ ...edit, capacity: Number(e.target.value) })} />)}
          {F("Room", <select className={inp} value={edit.room} onChange={e => setEdit({ ...edit, room: e.target.value })}>
            <option>Sun Room</option><option>Foyer</option></select>)}
          {F("Category", <input className={inp} value={edit.category || ""} onChange={e => setEdit({ ...edit, category: e.target.value })} />)}
          {F("Pricing", <input className={inp} value={edit.pricing || ""} onChange={e => setEdit({ ...edit, pricing: e.target.value })} />)}
          {F("Active", <select className={inp} value={edit.active} onChange={e => setEdit({ ...edit, active: Number(e.target.value) })}>
            <option value={1}>Yes</option><option value={0}>No</option></select>)}
          <div className="col-span-2 md:col-span-4 flex gap-2">
            <button className="btn btn--accent" type="submit">{edit.id ? "Save Changes" : "Create Class"}</button>
            <button className="btn" type="button" onClick={() => setEdit(null)}>Cancel</button>
          </div>
        </form>
      )}

      <div className="overflow-x-auto">
        <table className="w-full text-sm">
          <thead><tr className="text-left border-b border-black/20">
            {["Day", "Time", "Title", "Instructor", "Min", "Cap", "Room", "Active", ""].map(h => <th key={h} className="py-2 pr-3">{h}</th>)}
          </tr></thead>
          <tbody>
            {shown.map(r => (
              <tr key={r.id} className={`border-b border-black/5 ${r.active ? "" : "opacity-40"}`}>
                <td className="py-1.5 pr-3">{DAYS[r.day]}</td><td className="pr-3">{r.time}</td>
                <td className="pr-3 font-medium">{r.title}</td><td className="pr-3">{r.instructor}</td>
                <td className="pr-3">{r.duration_min}</td><td className="pr-3">{r.capacity}</td>
                <td className="pr-3">{r.room}</td><td className="pr-3">{r.active ? "✓" : "—"}</td>
                <td className="whitespace-nowrap">
                  <button className="underline mr-3" onClick={() => { setEdit({ ...r }); setMsg(""); window.scrollTo(0, 0); }}>edit</button>
                  {r.active ? <button className="underline text-red-800" onClick={() => del(r.id!)}>deactivate</button> : null}
                </td>
              </tr>))}
          </tbody>
        </table>
      </div>
    </section>
  );
}


function fmtWk(d: Date) { return d.toISOString().slice(0, 10); }
function curSun() { const n = new Date(); const d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
const VENMO = "https://account.venmo.com/u/Katelyn-Carano";

function TallyTab() {
  const [scale, setScale] = useState<"week" | "month">("week");
  const [week, setWeek] = useState(() => fmtWk(curSun()));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const range = () => {
    if (scale === "week") return { start: week, end: "" };
    const [y, m] = month.split("-").map(Number);
    const end = m === 12 ? `${y + 1}-01-01` : `${y}-${String(m + 1).padStart(2, "0")}-01`;
    return { start: `${month}-01`, end };
  };
  const load = () => { const r = range(); return fetch(`/api/admin/people?start=${r.start}${r.end ? "&end=" + r.end : ""}`).then(r => r.json()).then(setData); };
  useEffect(() => { load(); }, [week, month, scale]);
  const shift = (n: number) => {
    if (scale === "week") { const d = new Date(week + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 7 * n); setWeek(fmtWk(d)); }
    else { const [y, m] = month.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); }
  };
  const post = async (body: any) => { setBusy(true); await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); await load(); setBusy(false); };

  if (!data) return <p>Loading…</p>;
  if (!data.people) return <p>Admins only.</p>;
  return (
    <div>
      <div className="flex items-center gap-3 mb-4">
        <button className="btn" onClick={() => shift(-1)}>‹</button>
        <span className="inline-flex rounded overflow-hidden border border-black/20 mr-2">
          {(["week", "month"] as const).map(sc => (
            <button key={sc} onClick={() => setScale(sc)}
              className={`px-2 py-0.5 text-xs ${scale === sc ? "bg-ea-espresso text-white" : "bg-white"}`}>
              {sc === "week" ? "Week" : "Month"}
            </button>
          ))}
        </span>
        <strong>{scale === "week"
          ? (() => { const s = new Date(week + "T00:00:00Z"), e = new Date(week + "T00:00:00Z"); e.setUTCDate(e.getUTCDate() + 6);
              const f = (d: Date) => d.toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });
              return `${f(s)} – ${f(e)}, ${e.getUTCFullYear()}`; })()
          : new Date(month + "-15T00:00:00Z").toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</strong>
        <button className="btn" onClick={() => shift(1)}>›</button>
      </div>
      {(() => {
        const ppl = data.people as any[];
        const r = range();
        const end = r.end || (() => { const d = new Date(r.start + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 7); return d.toISOString().slice(0, 10); })();
        const inR = (d: string) => d >= r.start && d < end;
        const cls = ppl.flatMap(p => p.classes);
        const og = ppl.flatMap(p => p.opengym);
        const active = ppl.filter(p => p.classes.length + p.opengym.length > 0);
        const by = (m: string) => cls.filter((c: any) => c.pay_method === m).length;
        const owing = ppl.filter(p => { const t = p.classes.length + p.opengym.length;
          const pk = p.packs.find((k: any) => k.remaining > 0) || p.packs[0];
          return t > 0 && (!pk || pk.remaining < t); }).length;
        const paysIn = ppl.flatMap(p => p.payments || []).filter((x: any) => inR(x.date));
        const paid = paysIn.reduce((s: number, x: any) => s + (x.amount || 0), 0);
        const packsSold = ppl.flatMap(p => p.packs || []).filter((k: any) => inR((k.purchased_at || "").slice(0, 10))).length;
        const stat = (n: any, l: string) => (
          <div className="bg-white border border-ea-accent/40 rounded p-2 text-center min-w-[5.5rem]">
            <div className="text-xl font-semibold leading-tight">{n}</div>
            <div className="text-[11px] text-ea-espresso/60 leading-tight">{l}</div>
          </div>);
        return (
          <div className="flex flex-wrap gap-2 mb-4">
            {stat(active.length, "active students")}
            {stat(cls.length, "class signups")}
            {stat(og.length, "open gym visits")}
            {stat(by("pack"), "paid by pack")}
            {stat(by("venmo"), "venmo")}
            {stat(by("cash"), "cash")}
            {stat(owing, "owe money")}
            {stat("$" + paid, "payments logged")}
            {stat(packsSold, "packs sold")}
          </div>
        );
      })()}
      {[...data.people].sort((a: any, b: any) =>
        (b.classes.length + b.opengym.length) - (a.classes.length + a.opengym.length)).map((p: any) => {
        const taken = p.classes.length + p.opengym.length;
        const pack = p.packs.find((k: any) => k.remaining > 0) || p.packs[0];
        const owes = taken > 0 && (!pack || pack.remaining < taken);
        const smsBody = encodeURIComponent(
          `Hi ${p.name?.split(" ")[0] || ""}! This ${scale} at Elemental you took ${taken} class${taken === 1 ? "" : "es"}.` +
          (pack ? ` Your class pack has ${pack.remaining} of ${pack.size} classes left.` : "") +
          (owes ? ` Please Venmo Katelyn (note: "Aerial") or bring cash for the balance. ${VENMO}` : " You're all set!"));
        const fmtD = (d: string) => new Date(d + "T00:00:00Z").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
        const fmtT = (t: string) => { const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`; };
        const payChip = (m: string | null) => m ?
          <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " +
            (m === "pack" ? "bg-ea-gold/40 text-ea-olive" : m === "venmo" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800")}>{m}</span> : null;
        return (
          <div key={p.email} className="border border-ea-accent/40 rounded-lg p-4 mb-3 bg-white">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 border-b border-ea-accent/20">
              <strong className="text-lg">{p.name || p.email}</strong>
              <span className="text-sm opacity-60">{p.email}{p.phone ? " · " + p.phone : ""}</span>
              <span className="ml-auto flex items-center gap-2">
                <span className="text-sm font-semibold">{taken} visit{taken === 1 ? "" : "s"} this {scale}</span>
                <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (pack ? "bg-ea-cream text-ea-espresso" : "bg-black/5 text-black/50")}>
                  {pack ? `pack ${pack.remaining}/${pack.size}` : "no pack"}
                </span>
                {owes && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700">owes</span>}
              </span>
            </div>
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Activity</div>
                {taken === 0 && <div className="text-sm opacity-50">No visits this {scale}.</div>}
                {p.classes.map((c: any, i: number) => (
                  <div key={"c" + i} className="text-sm flex items-baseline gap-2">
                    <span className="opacity-60 w-24 shrink-0">{fmtD(c.date)}</span>
                    <span>{fmtT(c.time)} · {c.title}</span>{payChip(c.pay_method)}
                  </div>))}
                {p.opengym.map((o: any, i: number) => (
                  <div key={"o" + i} className="text-sm flex items-baseline gap-2">
                    <span className="opacity-60 w-24 shrink-0">{fmtD(o.date)}</span>
                    <span>{fmtT(o.time)} · Open Gym ($10)</span>
                  </div>))}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Pack & payments</div>
                <div className="text-sm flex flex-wrap items-center gap-2">
                  {pack ? <span>Pack: <b>{pack.remaining}/{pack.size}</b> left</span> : <em className="opacity-60">no class pack</em>}
                  {pack && p.id && <>
                    <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => post({ op: "adjust_pack", id: pack.id, delta: -1 })}>−1</button>
                    <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => post({ op: "adjust_pack", id: pack.id, delta: 1 })}>+1</button>
                  </>}
                </div>
                {p.payments.length > 0 && <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide opacity-50 mb-0.5">Payments logged</div>
                  {p.payments.map((pm: any) => (
                    <div key={pm.id} className="text-sm flex items-center gap-2 py-0.5 border-b border-ea-accent/15 last:border-0">
                      <span className="opacity-60 w-24 shrink-0">{new Date(pm.date + "T00:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", year: "2-digit", timeZone: "UTC" })}</span>
                      <b className="w-14">${pm.amount}</b>
                      <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " + (pm.method === "venmo" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800")}>{pm.method}</span>
                      {pm.note && <span className="text-xs opacity-60 truncate">{pm.note}</span>}
                      <span className="ml-auto flex gap-1">
                        <button className="text-xs underline opacity-60 hover:opacity-100" disabled={busy} onClick={() => {
                          const a = prompt("Amount ($)?", String(pm.amount)); if (a === null) return;
                          const m = prompt("Method? (venmo/cash)", pm.method) || pm.method;
                          const d = prompt("Date (YYYY-MM-DD)?", pm.date) || pm.date;
                          post({ op: "edit_payment", id: pm.id, amount: +a, method: m, date: d });
                        }}>edit</button>
                        <button className="text-xs underline text-red-700/70 hover:text-red-700" disabled={busy} onClick={() => {
                          if (confirm(`Delete $${pm.amount} ${pm.method} payment on ${pm.date}?`)) post({ op: "delete_payment", id: pm.id });
                        }}>delete</button>
                      </span>
                    </div>
                  ))}
                </div>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {p.id && <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => { const sz = prompt("Pack size?", "4"); if (sz) post({ op: "add_pack", user_id: p.id, size: +sz }); }}>+ new pack</button>}
                  {p.id && <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => { const a = prompt("Payment amount ($)?"); if (a) post({ op: "add_payment", user_id: p.id, amount: +a, method: prompt("Method? (venmo/cash)", "venmo") || "venmo" }); }}>+ payment</button>}
                  {p.phone
                    ? <a className="btn text-xs !px-2.5 !py-1" href={`sms:${p.phone}?&body=${smsBody}`}>📱 text reminder</a>
                    : <span className="text-xs opacity-50 italic">no phone on file</span>}
                </div>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"schedule" | "tally">("tally");
  return (
    <section className="container py-8">
      <h1 className="font-serif text-3xl mb-4">Studio Admin</h1>
      <div className="flex gap-2 mb-6">
        {([["tally", "Members & Payments"], ["schedule", "Schedule Editor"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"px-6 py-2.5 rounded-full font-semibold tracking-wide transition-colors " +
              (tab === k ? "bg-ea-espresso text-ea-paper shadow" : "bg-ea-cream/70 text-ea-espresso/70 hover:bg-ea-cream")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "tally" ? <TallyTab /> : <ScheduleTab />}
    </section>
  );
}
