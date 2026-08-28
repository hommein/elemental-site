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
        <strong>{scale === "week" ? `Week of ${week}` : new Date(month + "-15T00:00:00Z").toLocaleString("en-US", { month: "long", year: "numeric", timeZone: "UTC" })}</strong>
        <button className="btn" onClick={() => shift(1)}>›</button>
      </div>
      {data.people.map((p: any) => {
        const taken = p.classes.length + p.opengym.length;
        const pack = p.packs.find((k: any) => k.remaining > 0) || p.packs[0];
        const owes = taken > 0 && (!pack || pack.remaining < taken);
        const smsBody = encodeURIComponent(
          `Hi ${p.name?.split(" ")[0] || ""}! This ${scale} at Elemental you took ${taken} class${taken === 1 ? "" : "es"}.` +
          (pack ? ` Your class pack has ${pack.remaining} of ${pack.size} classes left.` : "") +
          (owes ? ` Please Venmo Katelyn (note: "Aerial") or bring cash for the balance. ${VENMO}` : " You're all set!"));
        return (
          <div key={p.email} className="border border-ea-accent/40 rounded p-3 mb-3">
            <div className="flex flex-wrap items-baseline gap-x-3">
              <strong>{p.name}</strong><span className="text-sm opacity-70">{p.email}</span>
              <span className="ml-auto font-semibold">{taken} class{taken === 1 ? "" : "es"} this {scale}</span>
            </div>
            <div className="text-sm mt-1">
              {p.classes.map((c: any, i: number) => <div key={i}>{c.date} · {c.time} {c.title}</div>)}
              {p.opengym.map((o: any, i: number) => <div key={i}>{o.date} · {o.time} Open Gym ($10)</div>)}
            </div>
            <div className="text-sm mt-2 flex flex-wrap items-center gap-2">
              {pack ? <span>Pack: <b>{pack.remaining}/{pack.size}</b> left</span> : <em>no class pack</em>}
              {pack && p.id && <>
                <button className="btn text-xs" disabled={busy} onClick={() => post({ op: "adjust_pack", id: pack.id, delta: -1 })}>−1</button>
                <button className="btn text-xs" disabled={busy} onClick={() => post({ op: "adjust_pack", id: pack.id, delta: 1 })}>+1</button>
              </>}
              {p.id && <button className="btn text-xs" disabled={busy} onClick={() => { const s = prompt("Pack size?", "10"); if (s) post({ op: "add_pack", user_id: p.id, size: +s }); }}>+ new pack</button>}
              {p.id && <button className="btn text-xs" disabled={busy} onClick={() => { const a = prompt("Payment amount ($)?"); if (a) post({ op: "add_payment", user_id: p.id, amount: +a, method: prompt("Method? (venmo/cash)", "venmo") || "venmo" }); }}>+ payment</button>}
              {owes && <span className="text-red-700 font-semibold">owes</span>}
              <a className="btn text-xs ml-auto" href={`sms:?&body=${smsBody}`}>📱 text reminder</a>
            </div>
            {p.payments.length > 0 && <div className="text-xs opacity-70 mt-1">Recent payments: {p.payments.slice(0, 3).map((pm: any) => `$${pm.amount} ${pm.method} ${pm.date}`).join(" · ")}</div>}
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
        <button className={"btn " + (tab === "tally" ? "btn--accent" : "")} onClick={() => setTab("tally")}>Weekly Tally</button>
        <button className={"btn " + (tab === "schedule" ? "btn--accent" : "")} onClick={() => setTab("schedule")}>Schedule Editor</button>
      </div>
      {tab === "tally" ? <TallyTab /> : <ScheduleTab />}
    </section>
  );
}
