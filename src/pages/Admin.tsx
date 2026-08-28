import { useEffect, useState } from "react";
import { me } from "../lib/user";

type Cls = { id?: number; title: string; instructor: string | null; day: number; time: string;
  duration_min: number; category: string | null; pricing: string | null; capacity: number; active: number; room: string };
const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const BLANK: Cls = { title: "", instructor: "", day: 1, time: "09:00", duration_min: 60, category: "", pricing: "", capacity: 8, active: 1, room: "Sun Room" };

export default function Admin() {
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
