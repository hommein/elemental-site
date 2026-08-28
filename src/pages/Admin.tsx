import { useEffect, useRef, useState } from "react";

const EMOJIS = ["😊","😄","🥳","🤸","🧘","💪","🔥","✨","🌟","⭐","🎉","🎊","❤️","🧡","💛","💚","💙","💜","🤍","🙌","👏","🙏","👍","💃","🕺","🎪","🎭","🩰","🌙","☀️","🌈","🌸","🌺","🍂","🎃","🎄","🎁","⏰","📅","📣","💌","✅","❗","❓","➡️","👉","🆕","🆓"];
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


/* ---- tiny dependency-free SVG charts ---- */
const CH = { gold: "#f0bd65", brown: "#9f664a", tan: "#bd8f71", olive: "#7f6436", cream: "#e9cbb1", sky: "#7ab8d9", green: "#7fb069" };
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white border border-ea-accent/40 rounded-lg p-3">
    <div className="text-xs font-semibold text-ea-espresso/70 mb-2">{title}</div>{children}</div>;
}
function StackBars({ rows, series, labels, money }: {
  rows: number[][]; series: { name: string; color: string }[]; labels: string[]; money?: boolean }) {
  const totals = rows.map(r => r.reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  const n = rows.length, bw = 100 / n;
  const fmt = (v: number) => money ? "$" + Math.round(v) : String(Math.round(v));
  return (<div>
    <svg viewBox="0 0 100 46" className="w-full" preserveAspectRatio="none">
      {rows.map((r, i) => { let y = 40; return r.map((v, j) => {
        const h = (v / max) * 36; y -= h;
        return <rect key={i + "-" + j} x={i * bw + bw * 0.15} y={y} width={bw * 0.7} height={h} fill={series[j].color} rx="0.6" />;
      }); })}
      {totals.map((t, i) => t > 0 &&
        <text key={i} x={i * bw + bw / 2} y={38 - (t / max) * 36} textAnchor="middle" fontSize="3.2" fill="#5a463a">{fmt(t)}</text>)}
      <line x1="0" y1="40" x2="100" y2="40" stroke="#e0d5cc" strokeWidth="0.4" />
    </svg>
    <div className="flex text-[9px] text-ea-espresso/50">
      {labels.map((l, i) => <span key={i} className="text-center" style={{ width: bw + "%" }}>{l}</span>)}
    </div>
    {series.length > 1 && <div className="flex gap-3 mt-1">
      {series.map(s => <span key={s.name} className="text-[10px] flex items-center gap-1">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: s.color }} />{s.name}</span>)}
    </div>}
  </div>);
}
function HBars({ items, color }: { items: { label: string; n: number }[]; color: string }) {
  const max = Math.max(1, ...items.map(i => i.n));
  return <div className="space-y-1">
    {items.map(it => <div key={it.label} className="flex items-center gap-2 text-xs">
      <span className="w-32 truncate text-right text-ea-espresso/70">{it.label}</span>
      <div className="flex-1 bg-ea-cream/30 rounded h-4 relative">
        <div className="h-4 rounded" style={{ width: (it.n / max) * 100 + "%", background: color }} />
        <span className="absolute inset-y-0 left-1.5 flex items-center text-[10px] font-semibold text-ea-espresso/80">{it.n}</span>
      </div>
    </div>)}
    {!items.length && <p className="text-xs opacity-50 italic">no data yet</p>}
  </div>;
}
function Donut({ parts }: { parts: { label: string; n: number; color: string }[] }) {
  const tot = parts.reduce((s, p) => s + p.n, 0);
  if (!tot) return <p className="text-xs opacity-50 italic">no data yet</p>;
  let acc = 0; const R = 15.9155;
  return <div className="flex items-center gap-4">
    <svg viewBox="0 0 42 42" className="w-24 h-24 shrink-0">
      {parts.filter(p => p.n > 0).map(p => {
        const frac = p.n / tot, off = acc; acc += frac;
        return <circle key={p.label} cx="21" cy="21" r={R} fill="none" stroke={p.color} strokeWidth="7"
          strokeDasharray={`${frac * 100} ${100 - frac * 100}`} strokeDashoffset={25 - off * 100} />;
      })}
      <text x="21" y="22.5" textAnchor="middle" fontSize="7" fontWeight="600" fill="#5a463a">{tot}</text>
    </svg>
    <div className="space-y-0.5">
      {parts.map(p => <div key={p.label} className="text-[11px] flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
        {p.label} — <b>{p.n}</b> ({Math.round(p.n / tot * 100)}%)</div>)}
    </div>
  </div>;
}
function TrendsSection() {
  const [st, setSt] = useState<any>(null);
  const [open, setOpen] = useState(true);
  useEffect(() => { fetch("/api/admin/stats?weeks=12").then(r => r.json()).then(setSt); }, []);
  if (!st?.weeks) return null;
  const wk = st.weeks as any[];
  const wl = wk.map((w: any, i: number) => (i % 2 === wk.length % 2) ? "" :
    new Date(w.week + "T00:00:00Z").toLocaleString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" }));
  const catColor: Record<string, string> = { aerial: CH.gold, flex: CH.cream, flow: CH.tan, dance: CH.brown, community: CH.sky, selah: "#cccccc" };
  return (<div className="mb-5">
    <button className="text-sm font-semibold text-ea-espresso/70 mb-2" onClick={() => setOpen(o => !o)}>
      📈 Studio trends (last 12 weeks) {open ? "▾" : "▸"}</button>
    {open && <div className="grid gap-3 md:grid-cols-2">
      <ChartCard title="Attendance per week">
        <StackBars rows={wk.map(w => [w.signups, w.opengym])} labels={wl}
          series={[{ name: "class signups", color: CH.gold }, { name: "open gym", color: CH.tan }]} />
      </ChartCard>
      <ChartCard title="Payments logged per week ($)">
        <StackBars rows={wk.map(w => [w.revenue])} labels={wl} money series={[{ name: "$", color: CH.green }]} />
      </ChartCard>
      <ChartCard title="New students & packs sold per week">
        <StackBars rows={wk.map(w => [w.new_users, w.packs])} labels={wl}
          series={[{ name: "new accounts", color: CH.sky }, { name: "packs sold", color: CH.olive }]} />
      </ChartCard>
      <ChartCard title="Most popular classes (90 days)">
        <HBars items={(st.topClasses || []).map((t: any) => ({ label: t.title, n: t.n }))} color={CH.gold} />
      </ChartCard>
      <ChartCard title="Busiest days (90 days)">
        <StackBars rows={(st.byDay || []).map((d: any) => [d.cls, d.og])} labels={DAYS}
          series={[{ name: "classes", color: CH.gold }, { name: "open gym", color: CH.tan }]} />
      </ChartCard>
      <div className="grid gap-3">
        <ChartCard title="How classes were paid (90 days)">
          <Donut parts={[
            { label: "pack", n: st.payMix?.pack || 0, color: CH.gold },
            { label: "venmo", n: st.payMix?.venmo || 0, color: CH.sky },
            { label: "cash", n: st.payMix?.cash || 0, color: CH.green },
            { label: "unset", n: st.payMix?.unset || 0, color: "#d8d0c8" }]} />
        </ChartCard>
        <ChartCard title="Signups by category (90 days)">
          <Donut parts={Object.entries(st.byCat || {}).map(([label, n]: any) =>
            ({ label, n, color: catColor[label] || "#d8d0c8" }))} />
        </ChartCard>
      </div>
    </div>}
  </div>);
}

function TallyTab() {
  const [scale, setScale] = useState<"week" | "month">("week");
  const [week, setWeek] = useState(() => fmtWk(curSun()));
  const [month, setMonth] = useState(() => new Date().toISOString().slice(0, 7));
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [q, setQ] = useState("");
  const [sort, setSort] = useState("active");
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
      <TrendsSection />
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
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input className="border border-ea-accent/50 rounded px-2.5 py-1.5 text-sm w-56" placeholder="🔍 Search name or email…"
          value={q} onChange={e => setQ(e.target.value)} />
        <label className="text-xs text-ea-espresso/60 ml-1">sort by</label>
        <select className="border border-ea-accent/50 rounded px-2 py-1.5 text-sm bg-white" value={sort} onChange={e => setSort(e.target.value)}>
          <option value="active">Most active</option>
          <option value="name">Name A–Z</option>
          <option value="owes">Owes money first</option>
          <option value="pack">Pack remaining (low first)</option>
          <option value="paid">Most paid ($)</option>
          <option value="newest">Newest member</option>
        </select>
      </div>
      {(() => {
        const norm = (s: any) => String(s || "").toLowerCase();
        const qq = norm(q.trim());
        const tk = (p: any) => p.classes.length + p.opengym.length;
        const pkRem = (p: any) => { const k = p.packs.find((k: any) => k.remaining > 0) || p.packs[0]; return k ? k.remaining : 9999; };
        const owesF = (p: any) => { const t = tk(p); const k = p.packs.find((k: any) => k.remaining > 0) || p.packs[0]; return t > 0 && (!k || k.remaining < t); };
        const paidT = (p: any) => (p.payments || []).reduce((s: number, x: any) => s + (x.amount || 0), 0);
        const cmp: Record<string, (a: any, b: any) => number> = {
          active: (a, b) => tk(b) - tk(a),
          name: (a, b) => norm(a.name || a.email).localeCompare(norm(b.name || b.email)),
          owes: (a, b) => Number(owesF(b)) - Number(owesF(a)) || tk(b) - tk(a),
          pack: (a, b) => pkRem(a) - pkRem(b),
          paid: (a, b) => paidT(b) - paidT(a),
          newest: (a, b) => String(b.created_at || "").localeCompare(String(a.created_at || "")),
        };
        const shown = [...data.people]
          .filter((p: any) => !qq || norm(p.name).includes(qq) || norm(p.email).includes(qq))
          .sort(cmp[sort] || cmp.active);
        if (!shown.length) return <p className="text-sm opacity-60 italic">No members match "{q}".</p>;
        return shown.map((p: any) => {
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
      });
      })()}
    </div>
  );
}


function EmailTab() {
  const [data, setData] = useState<any>(null);
  const [sel, setSel] = useState<Set<string>>(new Set());
  const [subject, setSubject] = useState("");
  const [tplId, setTplId] = useState<number | null>(null);
  const [tplName, setTplName] = useState("");
  const [attachments, setAttachments] = useState<{ filename: string; content: string }[]>([]);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [showEmoji, setShowEmoji] = useState(false);
  const edRef = useRef<HTMLDivElement>(null);

  const load = () => fetch("/api/admin/email").then(r => r.json()).then(setData);
  useEffect(() => { load(); }, []);
  const post = (body: any) => fetch("/api/admin/email", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }).then(r => r.json());

  if (!data) return <p>Loading…</p>;
  if (!data.recipients) return <p>Admins only.</p>;
  const rec = data.recipients as any[];

  const group = (name: string, list: any[]) => (
    <button key={name} className="text-xs underline mr-3" onClick={() => setSel(new Set(list.map(r => r.email)))}>
      {name} ({list.length})
    </button>);
  const toggle = (e: string) => { const n = new Set(sel); n.has(e) ? n.delete(e) : n.add(e); setSel(n); };
  const cmd = (c: string, v?: string) => { document.execCommand(c, false, v); edRef.current?.focus(); };

  async function addFiles(files: FileList | null) {
    if (!files) return;
    for (const f of Array.from(files)) {
      if (f.size > 3_000_000) { setMsg(`${f.name} is too big (3MB max per file).`); continue; }
      const b64: string = await new Promise(res => { const r = new FileReader(); r.onload = () => res(String(r.result).split(",")[1]); r.readAsDataURL(f); });
      setAttachments(a => [...a, { filename: f.name, content: b64 }]);
    }
  }
  async function saveTemplate(asNew: boolean) {
    const name = tplName || prompt("Template name?") || "";
    if (!name) return;
    setBusy(true);
    const r = await post({ op: "save_template", id: asNew ? null : tplId, name, subject, html: edRef.current?.innerHTML || "" });
    setTplId(r.id); setTplName(name); await load(); setBusy(false); setMsg("Template saved.");
  }
  function loadTemplate(t: any) {
    setTplId(t.id); setTplName(t.name); setSubject(t.subject);
    if (edRef.current) edRef.current.innerHTML = t.html;
  }
  async function send() {
    if (!sel.size) { setMsg("Pick at least one recipient."); return; }
    if (!confirm(`Send "${subject}" to ${sel.size} recipient${sel.size === 1 ? "" : "s"}?`)) return;
    setBusy(true); setMsg("");
    const r = await post({ op: "send", to: [...sel], subject, html: edRef.current?.innerHTML || "", attachments });
    setBusy(false);
    setMsg(r.error ? r.error : `Sent to ${r.sent} recipient${r.sent === 1 ? "" : "s"}.` + (r.failed?.length ? ` ${r.failed.length} failed.` : ""));
  }

  return (
    <div className="grid lg:grid-cols-[16rem_1fr] gap-6">
      <div>
        <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Recipients ({sel.size} selected)</div>
        <div className="text-sm mb-2">
          {group("Everyone", rec)}
          {group("Has pack", rec.filter(r => r.has_pack))}
          {group("Active 30d", rec.filter(r => r.active_30d))}
          <button className="text-xs underline" onClick={() => setSel(new Set())}>Clear</button>
        </div>
        <div className="border border-ea-accent/40 rounded max-h-96 overflow-y-auto bg-white">
          {rec.map(r => (
            <label key={r.email} className="flex items-center gap-2 px-2 py-1 text-sm border-b border-ea-accent/10 last:border-0 cursor-pointer hover:bg-ea-cream/40">
              <input type="checkbox" checked={sel.has(r.email)} onChange={() => toggle(r.email)} />
              <span className="truncate">{r.name || r.email}</span>
            </label>))}
        </div>
        <div className="text-[11px] uppercase tracking-wide opacity-50 mt-4 mb-1">Templates</div>
        {data.templates.length === 0 && <div className="text-xs opacity-50">None saved yet.</div>}
        {data.templates.map((t: any) => (
          <div key={t.id} className="flex items-center gap-1 text-sm py-0.5">
            <button className={"underline truncate " + (t.id === tplId ? "font-bold" : "")} onClick={() => loadTemplate(t)}>{t.name}</button>
            <button className="text-xs text-red-700/70 ml-auto" onClick={async () => { if (confirm(`Delete template "${t.name}"?`)) { await post({ op: "delete_template", id: t.id }); if (t.id === tplId) setTplId(null); load(); } }}>✕</button>
          </div>))}
      </div>
      <div>
        {!data.configured && <p className="text-sm bg-amber-100 text-amber-900 rounded p-2 mb-3">
          Email delivery isn't configured yet — composing & templates work, but sending needs a (free) Resend API key added as the RESEND_API_KEY secret.</p>}
        <input placeholder="Subject" value={subject} onChange={e => setSubject(e.target.value)}
          className="border border-black/20 rounded-lg px-3 py-2 w-full mb-2" />
        <div className="flex flex-wrap items-center gap-1 border border-b-0 border-black/20 rounded-t-lg px-2 py-1 bg-ea-cream/40 text-sm">
          <button className="px-2 py-0.5 font-bold hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); cmd("bold"); }}>B</button>
          <button className="px-2 py-0.5 italic hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); cmd("italic"); }}>I</button>
          <button className="px-2 py-0.5 underline hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); cmd("underline"); }}>U</button>
          <select className="text-xs bg-white rounded border border-black/10" defaultValue="" onChange={e => { if (e.target.value) cmd("fontSize", e.target.value); e.target.value = ""; }}>
            <option value="" disabled>Size</option><option value="2">Small</option><option value="3">Normal</option><option value="5">Large</option><option value="6">Huge</option>
          </select>
          <input type="color" title="Text color" className="w-7 h-7 p-0 border-0 bg-transparent cursor-pointer" onChange={e => cmd("foreColor", e.target.value)} />
          <button className="px-2 py-0.5 hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); const u = prompt("Link URL?", "https://"); if (u) cmd("createLink", u); }}>🔗</button>
          <button className="px-2 py-0.5 hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); const u = prompt("Image URL? (or use 📎 to attach files)", "https://"); if (u) cmd("insertImage", u); }}>🖼️</button>
          <span className="relative">
            <button className="px-2 py-0.5 hover:bg-white rounded" title="Insert emoji" onMouseDown={e => { e.preventDefault(); setShowEmoji(v => !v); }}>😊</button>
            {showEmoji && (
              <div className="absolute left-0 top-7 z-20 bg-white border border-black/15 rounded-lg shadow-lg p-2 grid grid-cols-8 gap-0.5 w-64">
                {EMOJIS.map(em => (
                  <button key={em} className="text-lg leading-none p-1 hover:bg-ea-cream rounded"
                    onMouseDown={e => { e.preventDefault(); cmd("insertText", em); }}>{em}</button>
                ))}
              </div>
            )}
          </span>
          <label className="px-2 py-0.5 hover:bg-white rounded cursor-pointer">📎<input type="file" multiple className="hidden" onChange={e => { addFiles(e.target.files); e.target.value = ""; }} /></label>
          <button className="px-2 py-0.5 hover:bg-white rounded" onMouseDown={e => { e.preventDefault(); cmd("removeFormat"); }} title="Clear formatting">⌫</button>
        </div>
        <div ref={edRef} contentEditable suppressContentEditableWarning
          className="border border-black/20 rounded-b-lg bg-white px-4 py-3 min-h-56 focus:outline-none prose-sm"
          style={{ fontFamily: "Georgia, serif" }} />
        {attachments.length > 0 && <div className="text-xs mt-1">
          {attachments.map((a, i) => <span key={i} className="inline-flex items-center gap-1 bg-ea-cream/60 rounded px-2 py-0.5 mr-1">📎 {a.filename}
            <button onClick={() => setAttachments(x => x.filter((_, j) => j !== i))}>✕</button></span>)}
        </div>}
        <div className="flex flex-wrap items-center gap-2 mt-3">
          <button className="btn text-sm !px-4 !py-2" disabled={busy || !subject} onClick={send}>Send to {sel.size || "…"}</button>
          <button className="btn text-sm !px-4 !py-2 bg-ea-cream/70 !text-ea-espresso" disabled={busy} onClick={() => saveTemplate(!tplId)}>{tplId ? "Update template" : "Save as template"}</button>
          {tplId && <button className="text-sm underline" disabled={busy} onClick={() => saveTemplate(true)}>Save as new</button>}
          {msg && <span className="text-sm font-semibold">{msg}</span>}
        </div>
      </div>
    </div>
  );
}

export default function Admin() {
  const [tab, setTab] = useState<"schedule" | "tally" | "email">("tally");
  return (
    <section className="container py-8">
      <h1 className="font-serif text-3xl mb-4">Studio Admin</h1>
      <div className="flex gap-2 mb-6">
        {([["tally", "Members & Payments"], ["schedule", "Schedule Editor"], ["email", "Email"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"px-6 py-2.5 rounded-full font-semibold tracking-wide transition-colors " +
              (tab === k ? "bg-ea-espresso text-ea-paper shadow" : "bg-ea-cream/70 text-ea-espresso/70 hover:bg-ea-cream")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "tally" ? <TallyTab /> : tab === "email" ? <EmailTab /> : <ScheduleTab />}
    </section>
  );
}
