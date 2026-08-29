import { useEffect, useRef, useState } from "react";

const EMOJIS = ["😊","😄","🥳","🤸","🧘","💪","🔥","✨","🌟","⭐","🎉","🎊","❤️","🧡","💛","💚","💙","💜","🤍","🙌","👏","🙏","👍","💃","🕺","🎪","🎭","🩰","🌙","☀️","🌈","🌸","🌺","🍂","🎃","🎄","🎁","⏰","📅","📣","💌","✅","❗","❓","➡️","👉","🆕","🆓"];

const today = () => new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10);
const nextDay = (d: string) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
import { me } from "../lib/user";

const DAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];
const OVF = ["title", "instructor", "time", "duration_min", "capacity", "room"] as const;
const stf = (t: string) => { const [h, m] = t.split(":").map(Number); return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${h >= 12 ? "pm" : "am"}`; };
const sdf = (d: string) => new Date(d + "T00:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", timeZone: "UTC" });

function ScheduleTab() {
  const [ok, setOk] = useState<boolean | null>(null);
  const [wk, setWk] = useState(() => fmtWk(curSun()));
  const [data, setData] = useState<any>(null);
  const [base, setBase] = useState<Record<number, any>>({});
  const [inactive, setInactive] = useState<any[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [addDay, setAddDay] = useState<number | null>(null);
  const [msg, setMsg] = useState("");

  async function load() {
    const [r1, r2] = await Promise.all([fetch(`/api/schedule?week=${wk}`), fetch("/api/admin/classes")]);
    if (!r2.ok) { setOk(false); return; }
    const j1 = await r1.json(), j2 = await r2.json();
    const bm: Record<number, any> = {}; const inact: any[] = [];
    for (const c of j2.classes) { bm[c.id] = c; if (!c.active && !c.on_date) inact.push(c); }
    setBase(bm); setInactive(inact); setData(j1); setOk(true);
  }
  useEffect(() => { me().then(u => u?.is_admin ? load() : setOk(false)); }, [wk]);

  if (ok === null) return <section className="container py-12"><p>Loading…</p></section>;
  if (!ok) return <section className="container py-12"><p>Admins only — <a className="underline" href="/account">sign in</a> with an admin account.</p></section>;
  if (!data) return null;

  const dates: string[] = data.dates;
  const rows: any[] = data.classes;
  const byDay: any[][] = [[], [], [], [], [], [], []];
  for (const c of rows) byDay[c.day].push(c);
  const isCur = wk === fmtWk(curSun());
  const shift = (n: number) => { setSel(null); setAddDay(null); setWk(fmtWk(new Date(Date.parse(wk + "T00:00:00Z") + n * 7 * 864e5))); };
  const live = rows.filter(c => !c.cancelled);
  const selC = sel != null ? rows.find(c => c.id === sel) : null;
  const names = (k: string) => [...new Set(Object.values(base).map((b: any) => b[k]).filter(Boolean))] as string[];

  return (
    <section className="container py-8">
      <div className="flex items-center gap-3 flex-wrap mb-1">
        <button className="btn px-3 py-1" onClick={() => shift(-1)}>‹</button>
        <div>
          <h2 className="font-display text-2xl leading-none">{isCur ? "This Week" : `Week of ${sdf(dates[0])}`}</h2>
          <div className="text-sm text-ea-espresso/60">{sdf(dates[0])} – {sdf(dates[6])}{isCur ? "" : " · "}{!isCur && <button className="underline" onClick={() => { setWk(fmtWk(curSun())); setSel(null); setAddDay(null); }}>back to this week</button>}</div>
        </div>
        <button className="btn px-3 py-1" onClick={() => shift(1)}>›</button>
        <div className="text-sm text-ea-espresso/70 ml-auto">
          {live.length} classes · {rows.reduce((s, c) => s + c.taken, 0)} signups{rows.length - live.length > 0 ? ` · ${rows.length - live.length} cancelled` : ""}
        </div>
      </div>
      <div className="flex gap-3 flex-wrap items-center text-xs text-ea-espresso/70 mb-3">
        {[...GORDER, "selah"].map(g => <span key={g} className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block" style={{ background: GCOLOR[g] }} />{GLABEL[g]}</span>)}
        <span className="inline-flex items-center gap-1"><span className="w-2.5 h-2.5 rounded-full inline-block bg-ea-gold ring-1 ring-ea-brown" />edited this week</span>
        <span className="text-ea-espresso/50">— click a class to edit · changes apply to one week or every week</span>
      </div>
      {msg && <p className="text-sm mb-2 text-ea-olive">{msg}</p>}
      {(selC || addDay != null) &&
        <EditPanel key={selC ? `e${selC.id}${selC.date}` : `a${addDay}`} c={selC} b={selC ? base[selC.id] : null}
          day={addDay ?? selC?.day ?? 1} dates={dates} names={names}
          onDone={(m: string) => { setMsg(m); setSel(null); setAddDay(null); load(); }}
          onClose={() => { setSel(null); setAddDay(null); }} />}
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-7 gap-2">
        {DAYS.map((dn, d) => (
          <div key={d} className="min-w-0">
            <div className={`text-center text-sm py-1 rounded-t-lg ${dates[d] === today() ? "bg-ea-espresso text-white" : "bg-ea-cream/60"}`}>
              <span className="font-medium">{dn}</span> <span className="opacity-70">{sdf(dates[d]).split(" ")[1]}</span>
            </div>
            <div className="flex flex-col gap-1.5 bg-black/[.03] rounded-b-lg p-1.5 min-h-24">
              {byDay[d].map(c => { const g = groupOf(c); return (
                <button key={c.id} onClick={() => { setAddDay(null); setSel(c.id === sel ? null : c.id); }}
                  className={`text-left rounded-lg px-2 py-1.5 border-l-4 text-xs leading-tight transition hover:shadow ${sel === c.id ? "ring-2 ring-ea-espresso" : ""} ${c.cancelled ? "opacity-50" : ""}`}
                  style={{ background: GCOLOR[g] + "26", borderColor: GCOLOR[g] }}>
                  <div className="flex items-center gap-1">
                    <span className="text-[11px] text-ea-espresso/70">{stf(c.time)}</span>
                    {c.cancelled ? <span className="text-[10px] font-medium text-red-700 ml-auto">CANCELLED</span> : c.modified ? <span className="w-2 h-2 rounded-full bg-ea-gold ring-1 ring-ea-brown ml-auto" title="edited this week" /> : null}
                    {c.one_off ? <span className="text-[10px] bg-ea-cream px-1 rounded ml-auto">one-off</span> : null}
                  </div>
                  <div className={`font-medium truncate ${c.cancelled ? "line-through" : ""}`}>{c.title}</div>
                  {c.instructor && <div className="text-ea-espresso/60 truncate">{c.instructor}</div>}
                  {!c.cancelled && <div className="flex items-center gap-1 mt-1">
                    <div className="h-1 rounded bg-black/10 flex-1"><div className="h-1 rounded" style={{ width: `${Math.min(100, c.taken / c.capacity * 100)}%`, background: GCOLOR[g] }} /></div>
                    <span className="text-[10px] text-ea-espresso/60">{c.taken}/{c.capacity}</span>
                  </div>}
                </button>); })}
              <button className="text-xs text-ea-espresso/50 hover:text-ea-espresso border border-dashed border-black/20 rounded-lg py-1 mt-auto"
                onClick={() => { setSel(null); setAddDay(d); }}>+ add</button>
            </div>
          </div>
        ))}
      </div>
      {inactive.length > 0 && <details className="mt-6">
        <summary className="cursor-pointer text-sm text-ea-espresso/60">Removed classes ({inactive.length}) — restore</summary>
        <div className="flex flex-col gap-1 mt-2">
          {inactive.map(b => <div key={b.id} className="text-sm flex items-center gap-3">
            <span>{b.title} · {DAYS[b.day]} {stf(b.time)}{b.instructor ? ` · ${b.instructor}` : ""}</span>
            <button className="underline text-ea-olive" onClick={async () => { await api({ ...b, active: 1 }); setMsg("Restored " + b.title); load(); }}>restore</button>
          </div>)}
        </div>
      </details>}
    </section>
  );
}

async function api(body: any) {
  const r = await fetch("/api/admin/classes", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify(body) });
  const j = await r.json(); if (!r.ok) throw new Error(j.error || "Failed"); return j;
}

function EditPanel({ c, b, day, dates, names, onDone, onClose }:
  { c: any; b: any; day: number; dates: string[]; names: (k: string) => string[]; onDone: (m: string) => void; onClose: () => void }) {
  const adding = !c;
  const [f, setF] = useState<any>(() => adding
    ? { title: "", instructor: "", time: "16:00", duration_min: 60, capacity: 8, room: "Sun Room", category: "aerial", pricing: "dropin", price: "", day, scope: "always" }
    : { title: c.title, instructor: c.instructor || "", time: c.time, duration_min: c.duration_min, capacity: c.capacity, room: c.room,
        category: b.category || "", pricing: b.pricing || "dropin", price: b.price ?? "", day: c.day });
  const [err, setErr] = useState("");
  const [confirmDel, setConfirmDel] = useState(false);
  const past = !adding && c.date < today();
  const set = (k: string) => (e: any) => setF({ ...f, [k]: e.target.value });
  const dif = (k: string) => !adding && String(f[k] ?? "") !== String((k === "instructor" ? b[k] || "" : b[k]) ?? "");
  const inp = (k: string, extra = "") => `border rounded px-2 py-1 w-full ${dif(k) ? "border-ea-gold ring-2 ring-ea-gold/40 bg-ea-gold/10" : "border-black/20"} ${extra}`;
  const F = (label: string, el: React.ReactNode, w = "") => <label className={`flex flex-col gap-0.5 text-sm ${w}`}><span className="text-ea-espresso/60 text-xs">{label}</span>{el}</label>;
  const run = (fn: () => Promise<string>) => fn().then(onDone).catch(e => setErr(e.message));

  const diffs = () => {
    const s: any = {};
    for (const k of OVF) if (dif(k)) s[k] = k === "duration_min" || k === "capacity" ? Number(f[k]) : f[k];
    return s;
  };
  const baseBody = () => ({ id: c?.id, title: f.title, instructor: f.instructor, day: Number(f.day), time: f.time,
    duration_min: Number(f.duration_min), category: f.category, pricing: f.pricing, capacity: Number(f.capacity),
    active: 1, room: f.room, price: f.price === "" ? null : Number(f.price) });

  const saveWeek = () => run(async () => {
    await api({ op: "override", class_id: c.id, date: c.date, cancelled: c.cancelled ? 1 : 0, set: diffs() });
    return `Saved ${f.title} for the week of ${sdf(dates[0])} only.`;
  });
  const saveAll = () => run(async () => {
    await api({ ...baseBody(), on_date: b.on_date || null });
    if (c.cancelled) await api({ op: "override", class_id: c.id, date: c.date, cancelled: 1, set: {} });
    else await api({ op: "clear_override", class_id: c.id, date: c.date });
    return b.on_date ? `Saved ${f.title}.` : `Saved ${f.title} for every week.`;
  });
  const toggleCancel = () => run(async () => {
    await api({ op: "override", class_id: c.id, date: c.date, cancelled: c.cancelled ? 0 : 1, set: diffs() });
    return c.cancelled ? `${c.title} restored for this week.` : `${c.title} cancelled for this week only.`;
  });
  const remove = () => run(async () => { await api({ op: "delete", id: c.id, from: b.on_date ? undefined : c.date }); return `${c.title} removed from the schedule.`; });
  const create = () => run(async () => {
    await api({ ...baseBody(), on_date: f.scope === "once" ? dates[Number(f.day)] : null });
    return f.scope === "once" ? `${f.title} added on ${sdf(dates[Number(f.day)])} only.` : `${f.title} added every ${DAYS[Number(f.day)]}.`;
  });

  return (
    <div className="border-2 border-ea-espresso/20 bg-white rounded-xl p-4 mb-4 shadow-sm">
      <div className="flex items-center gap-2 mb-3 flex-wrap">
        <h3 className="font-display text-lg">{adding ? `New class — ${DAYS[day]} ${sdf(dates[day])}` : `${c.title} — ${DAYS[c.day]} ${sdf(dates[c.day])}`}</h3>
        {!adding && c.cancelled ? <span className="text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">cancelled this week</span> : null}
        {!adding && b.on_date ? <span className="text-xs bg-ea-cream px-2 py-0.5 rounded">one-off class</span> : null}
        <button className="ml-auto text-sm underline text-ea-espresso/60" onClick={onClose}>close</button>
      </div>
      <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-8 gap-2">
        {F("Class name", <input className={inp("title")} value={f.title} onChange={set("title")} />, "col-span-2")}
        {F("Instructor", <><input className={inp("instructor")} list="ea-instr" value={f.instructor} onChange={set("instructor")} />
          <datalist id="ea-instr">{names("instructor").map(n => <option key={n} value={n} />)}</datalist></>)}
        {F("Day", <select className={inp("day")} value={f.day} onChange={set("day")} disabled={!adding && !b?.on_date}>
          {DAYS.map((d, i) => <option key={i} value={i}>{d}</option>)}</select>)}
        {F("Start time", <input type="time" className={inp("time")} value={f.time} onChange={set("time")} />)}
        {F("Minutes", <input type="number" step="15" className={inp("duration_min")} value={f.duration_min} onChange={set("duration_min")} />)}
        {F("Capacity", <input type="number" className={inp("capacity")} value={f.capacity} onChange={set("capacity")} />)}
        {F("Room", <><input className={inp("room")} list="ea-room" value={f.room} onChange={set("room")} />
          <datalist id="ea-room">{names("room").map(n => <option key={n} value={n} />)}</datalist></>)}
        {F("Category", <><input className={inp("category")} list="ea-cat" value={f.category} onChange={set("category")} />
          <datalist id="ea-cat">{names("category").map(n => <option key={n} value={n} />)}</datalist></>)}
        {F("Payment", <select className={inp("pricing")} value={f.pricing} onChange={set("pricing")}>
          <option value="dropin">standard (packs ok)</option><option value="donation">donation</option><option value="external">paid to instructor</option></select>)}
        {F("Price $ (blank = default)", <input type="number" className={inp("price")} value={f.price} onChange={set("price")} />)}
        {adding && F("Repeats", <select className={inp("scope")} value={f.scope} onChange={set("scope")}>
          <option value="always">every week</option><option value="once">this week only</option></select>)}
      </div>
      {!adding && Object.keys(diffs()).length > 0 && <p className="text-xs text-ea-brown mt-2">Highlighted fields differ from the usual schedule — choose how to save.</p>}
      {err && <p className="text-sm text-red-700 mt-2">{err}</p>}
      <div className="flex gap-2 mt-3 flex-wrap items-center">
        {past ? <span className="text-sm text-ea-espresso/60 italic">Past class — read-only. Switch to a current or future week to make changes.</span>
        : adding ? <button className="btn" onClick={create}>Add Class</button> : <>
          {!b.on_date && <button className="btn" onClick={saveWeek}>Save · This Week Only</button>}
          <button className="btn btn--accent" onClick={saveAll}>{b.on_date ? "Save" : "Save · Every Week"}</button>
          {!b.on_date && <button className="btn" onClick={toggleCancel}>{c.cancelled ? "Restore This Week" : "Cancel This Week"}</button>}
          <span className="ml-auto" />
          {confirmDel
            ? <span className="text-sm">Remove {b.on_date ? "this one-off" : "from this week & all future weeks"}? <button className="underline text-red-700" onClick={remove}>yes, remove</button> · <button className="underline" onClick={() => setConfirmDel(false)}>no</button></span>
            : <button className="text-sm underline text-red-700" onClick={() => setConfirmDel(true)}>{b.on_date ? "Delete one-off" : "Remove · This & Future Weeks"}</button>}
        </>}
      </div>
    </div>
  );
}

function fmtWk(d: Date) { return d.toISOString().slice(0, 10); }
function curSun() { const n = new Date(); const d = new Date(Date.UTC(n.getFullYear(), n.getMonth(), n.getDate())); d.setUTCDate(d.getUTCDate() - d.getUTCDay()); return d; }
const VENMO = "https://account.venmo.com/u/Katelyn-Carano";
// canonical pack balance: SUM(remaining) across ALL packs (null = never had a pack).
// Must match /api/pack "balance" and signup.ts pack_remaining — one number everywhere.
const pkBal = (p: any): number | null =>
  p.packs && p.packs.length ? p.packs.reduce((s: number, k: any) => s + k.remaining, 0) : null;
// canonical "unpaid bookings" + "owes money" — the ONLY definitions; stat cards and
// member-card badges must always agree.
const unpaidOf = (p: any) => [...p.classes, ...p.opengym].filter((x: any) => x.billable && !x.paid);
// net $ owed = unpaid billable bookings + overdrawn pack ($27.50/class) − credit on file
const owedOf = (p: any) =>
  unpaidOf(p).reduce((s: number, x: any) => s + (Number(x.price) || 0), 0)
  + Math.max(0, -(pkBal(p) ?? 0)) * 27.5 - (Number(p.credit) || 0);
const owesOf = (p: any) => owedOf(p) > 0.004;
// base drop-in prices; per-class overrides (guest teachers etc.) ride in on each row's `price`
const BASE_PRICE: Record<string, number> = { aerial: 30, flex: 12, opengym: 10 };
const matchP = (i: any, k: string) =>
  k === "opengym" ? (i.kind === "opengym" || i.title === "Community Jam")
  : k === "flex" ? ["flex", "flow"].includes(i.category)
  : i.kind === "signups" && i.title !== "Community Jam" && !["flex", "flow"].includes(i.category);


/* ---- tiny dependency-free SVG charts ---- */
const CH = { gold: "#f0bd65", brown: "#9f664a", tan: "#bd8f71", olive: "#7f6436", cream: "#e9cbb1", sky: "#7ab8d9", green: "#7fb069" };
const GUESTS = new Set(["Bethany", "Mel", "Daniel", "Kelsey"]);
const groupOf = (c: { title: string; category?: string; instructor?: string | null }) =>
  c.category === "selah" ? "selah"
  : c.title === "Community Jam" ? "jam" : c.category === "flex" ? "flex"
  : c.title === "Belly Dance" || (c.instructor && GUESTS.has(c.instructor)) ? "guest" : "aerial";
const GCOLOR: Record<string, string> = { aerial: CH.gold, flex: CH.tan, guest: CH.olive, selah: "#c9c9c9", jam: "#e8b3cf" };
const GLABEL: Record<string, string> = { aerial: "Aerial", flex: "Flex", guest: "Guest Instructors", selah: "Selah Dance", jam: "Community Jam" };
const GORDER = ["aerial", "flex", "guest", "jam"];
function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return <div className="bg-white border border-ea-accent/40 rounded-lg p-3">
    <div className="text-xs font-semibold text-ea-espresso/70 mb-2">{title}</div>{children}</div>;
}
function OgCard({ st, wk, wl }: any) {
  const [view, setView] = useState("hours");
  const S = [{ name: "open gym & jam", color: GCOLOR.jam }];
  return (
    <ChartCard title="Open gym (90 days)">
      <select value={view} onChange={e => setView(e.target.value)}
        className="border border-black/20 rounded px-2 py-1 text-xs mb-2">
        <option value="hours">Most popular hours</option>
        <option value="days">Visits by day of week</option>
        <option value="weeks">Visits per week</option>
      </select>
      {view === "hours" && <StackBars series={S}
        labels={Array.from({ length: 13 }, (_, i) => { const h = i + 8; return `${((h + 11) % 12) + 1}${h >= 12 ? "p" : "a"}`; })}
        rows={Array.from({ length: 13 }, (_, i) => [st.ogHour?.[String(i + 8).padStart(2, "0") + ":00"] || 0])} />}
      {view === "days" && <StackBars series={S} labels={DAYS}
        rows={(st.byDay || []).map((d: any) => [d.og])} />}
      {view === "weeks" && <StackBars series={S} labels={wl} rows={wk.map((w: any) => [w.opengym])} />}
    </ChartCard>);
}
function StackBars({ rows, series, labels, money }: {
  rows: number[][]; series: { name: string; color: string }[]; labels: string[]; money?: boolean }) {
  const totals = rows.map(r => r.reduce((a, b) => a + b, 0));
  const max = Math.max(1, ...totals);
  const n = rows.length, bw = 100 / n;
  const fmt = (v: number) => money ? "$" + Math.round(v) : String(Math.round(v));
  return (<div>
    <svg viewBox="0 -5 100 51" className="w-full" preserveAspectRatio="none">
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
function HBars({ items, color }: { items: { label: string; n: number; color?: string }[]; color: string }) {
  const max = Math.max(1, ...items.map(i => i.n));
  return <div className="space-y-1">
    {items.map(it => <div key={it.label} className="flex items-center gap-2 text-xs">
      <span className="w-20 sm:w-32 truncate text-right text-ea-espresso/70">{it.label}</span>
      <div className="flex-1 bg-ea-cream/30 rounded h-4 relative">
        <div className="h-4 rounded" style={{ width: (it.n / max) * 100 + "%", background: it.color || color }} />
        <span className="absolute inset-y-0 left-1.5 flex items-center text-[10px] font-semibold text-ea-espresso/80">{it.n}</span>
      </div>
    </div>)}
    {!items.length && <p className="text-xs opacity-50 italic">no data yet</p>}
  </div>;
}
function Donut({ parts, money }: { parts: { label: string; n: number; color: string }[]; money?: boolean }) {
  const tot = parts.reduce((s, p) => s + p.n, 0);
  const F = (n: number) => money ? "$" + (Math.round(n * 100) / 100) : n;
  if (!tot) return <p className="text-xs opacity-50 italic">no data yet</p>;
  let acc = 0; const R = 15.9155;
  return <div className="flex items-center gap-4">
    <svg viewBox="0 0 42 42" className="w-24 h-24 shrink-0">
      {parts.filter(p => p.n > 0).map(p => {
        const frac = p.n / tot, off = acc; acc += frac;
        return <circle key={p.label} cx="21" cy="21" r={R} fill="none" stroke={p.color} strokeWidth="7"
          strokeDasharray={`${frac * 100} ${100 - frac * 100}`} strokeDashoffset={25 - off * 100} />;
      })}
      <text x="21" y="22.5" textAnchor="middle" fontSize={money ? "5.5" : "7"} fontWeight="600" fill="#5a463a">{F(tot)}</text>
    </svg>
    <div className="space-y-0.5">
      {parts.map(p => <div key={p.label} className="text-[11px] flex items-center gap-1.5">
        <span className="inline-block w-2.5 h-2.5 rounded-sm" style={{ background: p.color }} />
        {p.label} — <b>{F(p.n)}</b> ({Math.round(p.n / tot * 100)}%)</div>)}
    </div>
  </div>;
}
function TrendsTab() {
  const [st, setSt] = useState<any>(null);
  useEffect(() => { fetch("/api/admin/stats?weeks=12").then(r => r.json()).then(setSt); }, []);
  if (!st) return <p>Loading…</p>;
  if (!st.weeks) return <p>Admins only.</p>;
  const wk = st.weeks as any[];
  const wl = wk.map((w: any, i: number) => (i % 2 === wk.length % 2) ? "" :
    new Date(w.week + "T00:00:00Z").toLocaleString("en-US", { month: "numeric", day: "numeric", timeZone: "UTC" }));
  return (<div>
    <p className="text-sm text-ea-espresso/60 mb-3">Rolling 90-day view of studio activity (weekly charts cover the last 12 weeks).</p>
    <div className="grid gap-3 md:grid-cols-2">
      <ChartCard title="Attendance per week">
        <StackBars rows={wk.map(w => [w.signups, w.opengym])} labels={wl}
          series={[{ name: "class signups", color: CH.gold }, { name: "open gym", color: CH.tan }]} />
      </ChartCard>
      <ChartCard title="Payments logged per week ($)">
        <StackBars rows={wk.map(w => [w.revenue])} labels={wl} money series={[{ name: "$", color: CH.green }]} />
      </ChartCard>
      <OgCard st={st} wk={wk} wl={wl} />
      <ChartCard title="Most popular classes (90 days)">
        <HBars items={(st.topClasses || []).map((t: any) => ({ label: t.title, n: t.n, color: GCOLOR[t.group] }))} color={CH.gold} />
      </ChartCard>
      <ChartCard title="Busiest days (90 days)">
        <StackBars rows={(st.byDay || []).map((d: any) => [d.cls, d.og])} labels={DAYS}
          series={[{ name: "classes", color: CH.gold }, { name: "open gym", color: CH.tan }]} />
      </ChartCard>
      <div className="grid gap-3">
        <ChartCard title="How classes were paid (90 days)">
          <Donut money parts={[
            { label: "pack", n: st.payMix?.pack || 0, color: CH.gold },
            { label: "venmo", n: st.payMix?.venmo || 0, color: CH.sky },
            { label: "cash", n: st.payMix?.cash || 0, color: CH.green },
            { label: "unset", n: st.payMix?.unset || 0, color: "#d8d0c8" }]} />
        </ChartCard>
        <ChartCard title="Signups by group (90 days)">
          <Donut parts={GORDER.filter(k => st.byCat?.[k]).map(k =>
            ({ label: GLABEL[k], n: st.byCat[k], color: GCOLOR[k] }))} />
        </ChartCard>
      </div>
    </div>
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
  const jamFix = (j: any) => ({ ...j, people: (j.people || []).map((pp: any) => {
    const jam = pp.classes.filter((c: any) => c.title === "Community Jam");
    return jam.length ? { ...pp, classes: pp.classes.filter((c: any) => c.title !== "Community Jam"),
      opengym: [...pp.opengym, ...jam.map((c: any) => ({ ...c, title: "Community Jam", _kind: "class" }))] } : pp;
  }) });
  const load = () => { const r = range(); return fetch(`/api/admin/people?start=${r.start}${r.end ? "&end=" + r.end : ""}`).then(r => r.json()).then(j => setData(jamFix(j))); };
  useEffect(() => { load(); }, [week, month, scale]);
  const [wk5, setWk5] = useState<any>(null);
  const wk5start = (() => { const d = curSun(); d.setUTCDate(d.getUTCDate() - 28); return fmtWk(d); })();
  useEffect(() => {
    if (scale !== "month" || wk5) return;
    const e = curSun(); e.setUTCDate(e.getUTCDate() + 7);
    fetch(`/api/admin/people?start=${wk5start}&end=${fmtWk(e)}`).then(r => r.json()).then(j => setWk5(jamFix(j)));
  }, [scale]);
  const shift = (n: number) => {
    if (scale === "week") { const d = new Date(week + "T00:00:00Z"); d.setUTCDate(d.getUTCDate() + 7 * n); setWeek(fmtWk(d)); }
    else { const [y, m] = month.split("-").map(Number); const d = new Date(Date.UTC(y, m - 1 + n, 1)); setMonth(d.toISOString().slice(0, 7)); }
  };
  const post = async (body: any) => { setBusy(true); const r = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); if (!r.ok) { const j = await r.json().catch(() => ({})); alert(j.error || `Failed (${r.status}) — nothing saved`); } await load(); setBusy(false); };
  type PlanItem = { kind: string; id: number; date: string; time: string; title: string; category?: string; price: number; cover: boolean };
  type Pend = { amount: string; method: string; purpose: string; start?: string; items?: PlanItem[] };
  const [pend, setPend] = useState<Record<number, Pend>>({});
  const setP = (id: number, patch: any) => setPend(x => ({ ...x, [id]: { ...{ amount: "", method: "venmo", purpose: "" }, ...x[id], ...patch } }));
  const pendIds = Object.keys(pend).filter(k => {
    const pd = pend[+k]; if (!pd?.purpose) return false;
    return parseFloat(pd.amount) > 0 || (pd.purpose === "membership" && pd.method === "waived");
  }).map(Number);
  const [sugg, setSugg] = useState<Record<number, { items: PlanItem[] } | null>>({});
  useEffect(() => { (async () => {
    if (!data?.people) return;
    const out: Record<number, { items: PlanItem[] } | null> = {};
    for (const p of data.people) {
      if (!p.id || !(p.credit > 0)) continue;
      const r = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ op: "preview_payment", user_id: p.id, amount: 0 }) }).then(r => r.json());
      if ((r.items || []).some((i: any) => i.cover)) out[p.id] = { items: r.items };
    }
    setSugg(out);
  })(); }, [data]);
  // load a user's unpaid bookings; if `kind` given, auto-check the oldest matching one and fill the amount
  const fetchItems = async (id: number, kind?: string) => {
    const r = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "preview_payment", user_id: id, amount: 0 }) }).then(r => r.json());
    let items: PlanItem[] = (r.items || []).map((i: any) => ({ ...i, cover: false }));
    if (kind) {
      const ix = items.findIndex(i => matchP(i, kind));
      if (ix >= 0) items = items.map((i, j) => j === ix ? { ...i, cover: true } : i);
      const tot = items.filter(i => i.cover).reduce((s, i) => s + i.price, 0);
      setP(id, { items, amount: String(tot > 0 ? tot : BASE_PRICE[kind]) });
    } else setP(id, { items });
  };
  const toggleItem = (id: number, pd: Pend, it: PlanItem, on: boolean) => {
    const items = (pd.items || []).map(x => x.kind === it.kind && x.id === it.id ? { ...x, cover: on } : x);
    const tot = items.filter(i => i.cover).reduce((s, i) => s + i.price, 0);
    setP(id, { items, ...(tot > 0 ? { amount: String(tot) } : {}) });
  };
  const saveAll = async () => {
    setBusy(true);
    for (const id of pendIds) {
      const pd = pend[id]; const amt = parseFloat(pd.amount) || 0;
      let body: any;
      if (pd.purpose === "membership")
        body = { op: "add_membership", user_id: id, start: pd.start || undefined, method: pd.method, amount: amt };
      else if (pd.purpose === "pack")
        body = { op: "add_payment", user_id: id, amount: amt, method: pd.method, note: "class pack (4 classes)",
          plan: { credits: 4, new_pack: true, settle: [] } };
      else {
        const settle = (pd.items || []).filter(i => i.cover && (pd.purpose === "credit" || matchP(i, pd.purpose)))
          .map(i => ({ kind: i.kind, id: i.id }));
        const note = pd.purpose === "credit" ? "credit on file" :
          pd.purpose === "opengym" ? "open gym / jam" : `single ${pd.purpose} class`;
        body = { op: "add_payment", user_id: id, amount: amt, method: pd.method, note, plan: { credits: 0, settle } };
      }
      const r = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      if (!r.ok) { const j = await r.json().catch(() => ({})); alert(j.error || `Failed (${r.status})`); }
    }
    setPend({}); await load(); setBusy(false);
  };

  if (!data) return <p>Loading…</p>;
  if (!data.people) return <p>Admins only.</p>;
  return (
    <div>
      <div className="flex flex-wrap items-center gap-3 mb-4">
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
        const by = (m: string) => [...cls, ...og].filter((c: any) => c.pay_method === m).length;
        const val = (c: any) => c.pay_method === "pack" ? 27.5 : (c.price ?? 0);
        const by$ = (m: string) => [...cls, ...og].filter((c: any) => c.pay_method === m).reduce((s: number, c: any) => s + val(c), 0);
        const f$ = (n: number) => "$" + (Math.round(n * 100) / 100);
        const owing = ppl.filter(owesOf).length;
        const paysIn = ppl.flatMap(p => p.payments || []).filter((x: any) => inR(x.date));
        const paid = paysIn.reduce((s: number, x: any) => s + (x.amount || 0), 0);
        // packs SOLD = money received for pack credits (payments.pack_credits), not pack bookkeeping rows
        const packCr = paysIn.reduce((s: number, x: any) => s + (x.pack_credits || 0), 0);
        const packsSold = Math.round(packCr / 4 * 10) / 10;
        const label = scale === "week" ? "this week" : "this month";
        const stat = (n: any, l: string) => (
          <div className="bg-white border border-ea-accent/40 rounded p-2 text-center min-w-[5.5rem]">
            <div className="text-xl font-semibold leading-tight">{n}</div>
            <div className="text-[11px] text-ea-espresso/60 leading-tight">{l}</div>
          </div>);
        return (<>
          <div className="flex flex-wrap gap-2 mb-4">
            {stat(active.length, "active students")}
            {stat(cls.length, "class signups")}
            {stat(og.length, "open gym visits")}
            {stat(f$(by$("pack")), `by pack (${by("pack")})`)}
            {stat(f$(by$("venmo")), `venmo (${by("venmo")})`)}
            {stat(f$(by$("cash")), `cash (${by("cash")})`)}
            {stat(owing, "owe money")}
            {stat(f$(paid), "payments logged")}
            {stat(packsSold, `packs sold (${f$(packCr * 27.5)})`)}
            {stat("$" + ppl.reduce((s: number, p: any) => s + (p.credit || 0), 0).toFixed(2), "credit on file")}
          </div>
          <div className="grid gap-3 md:grid-cols-2 xl:grid-cols-4 mb-4">
            <ChartCard title={`Most popular classes (${label})`}>
              <HBars items={(() => { const m: Record<string, number> = {}, g: Record<string, string> = {};
                cls.forEach((c: any) => { m[c.title] = (m[c.title] || 0) + 1; g[c.title] = groupOf(c); });
                return Object.entries(m).map(([label, n]) => ({ label, n, color: GCOLOR[g[label]] }))
                  .sort((a, b) => b.n - a.n).slice(0, 8); })()} color={CH.gold} />
            </ChartCard>
            <ChartCard title={`Signups by group (${label})`}>
              <Donut parts={(() => { const m: Record<string, number> = {};
                cls.forEach((c: any) => { const k = groupOf(c); m[k] = (m[k] || 0) + 1; });
                return GORDER.filter(k => m[k]).map(k => ({ label: GLABEL[k], n: m[k], color: GCOLOR[k] })); })()} />
            </ChartCard>
            <ChartCard title={scale === "week" ? "Busiest days (this week)" : "Attendance by week (last 5 weeks)"}>
              {(() => {
                const GB = ["aerial", "flex", "guest"];
                const series = [...GB.map(k => ({ name: GLABEL[k], color: GCOLOR[k] })), { name: "Open Gym & Jam", color: GCOLOR.jam }];
                const dow = (d: string) => new Date(d + "T00:00:00Z").getUTCDay();
                if (scale === "week")
                  return <StackBars labels={DAYS} series={series}
                    rows={DAYS.map((_, i) => [...GB.map(k =>
                      cls.filter((c: any) => dow(c.date) === i && groupOf(c) === k).length),
                      og.filter((o: any) => dow(o.date) === i).length])} />;
                if (!wk5) return <p className="text-sm opacity-50">Loading…</p>;
                const wcls = (wk5.people || []).flatMap((pp: any) => pp.classes);
                const wog = (wk5.people || []).flatMap((pp: any) => pp.opengym);
                const s0 = new Date(wk5start + "T00:00:00Z").getTime();
                const wkIdx = (d: string) => Math.floor((new Date(d + "T00:00:00Z").getTime() - s0) / 6048e5);
                const labs = Array.from({ length: 5 }, (_, i) => {
                  const d = new Date(s0 + i * 6048e5);
                  return i === 4 ? "now" : `${d.getUTCMonth() + 1}/${d.getUTCDate()}`;
                });
                return <StackBars labels={labs} series={series}
                  rows={labs.map((_, i) => [...GB.map(k =>
                    wcls.filter((c: any) => wkIdx(c.date) === i && groupOf(c) === k).length),
                    wog.filter((o: any) => wkIdx(o.date) === i).length])} />;
              })()}
            </ChartCard>
            <ChartCard title={`How classes were paid (${label}, $)`}>
              <Donut money parts={[
                { label: "pack", n: by$("pack"), color: CH.gold },
                { label: "venmo", n: by$("venmo"), color: CH.sky },
                { label: "cash", n: by$("cash"), color: CH.green },
                { label: "unset", n: [...cls, ...og].filter((c: any) => !["pack","venmo","cash"].includes(c.pay_method)).reduce((s: number, c: any) => s + val(c), 0), color: "#d8d0c8" }]} />
            </ChartCard>
          </div>
        </>
        );
      })()}
      <div className="flex flex-wrap items-center gap-2 mb-3">
        <input className="border border-ea-accent/50 rounded px-2.5 py-1.5 text-sm w-full sm:w-56" placeholder="🔍 Search name or email…"
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
        const pkRem = (p: any) => { const b = pkBal(p); return b == null ? 9999 : b; };
        const owesF = owesOf;
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
        const bal = pkBal(p);
        const pack = bal != null ? { remaining: bal } : null;
        const owes = owesOf(p);
        const smsBody = encodeURIComponent(
          `Hi ${p.name?.split(" ")[0] || ""}! This ${scale} at Elemental you took ${taken} class${taken === 1 ? "" : "es"}.` +
          (pack ? ` Your class pack has ${pack.remaining} classes left.` : "") +
          (p.credit > 0 ? ` You have $${p.credit.toFixed(2)} credit on file.` : "") +
          (owes ? ` Please Venmo Katelyn $${owedOf(p).toFixed(2)} (note: "Aerial") or bring cash. ${VENMO}` : " You're all set!"));
        const fmtD = (d: string) => new Date(d + "T00:00:00Z").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
        const fmtT = (t: string) => { const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`; };
        const payBtn = (x: any, kind: string) => x.pay_method === "waived" ?
          <button className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-gray-200 text-gray-600"
            title="Payment waived (trade/comp) — click to un-waive" disabled={busy}
            onClick={() => post({ op: "waive", kind, id: x.id, on: 0 })}>waived</button>
          : !x.billable ? null : x.paid ?
          <button className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-emerald-100 text-emerald-800"
            title="Click to mark unpaid" disabled={busy}
            onClick={() => post({ op: "mark_paid", kind, id: x.id, paid: 0 })}>paid ✓</button> :
          <>
            <span className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-red-100 text-red-700">owes</span>
            <button className="text-[10px] px-1.5 py-px rounded-full font-semibold border border-emerald-400 text-emerald-700 hover:bg-emerald-50"
              disabled={busy} onClick={() => post({ op: "mark_paid", kind, id: x.id, paid: 1 })}>mark paid</button>
            <button className="text-[10px] px-1.5 py-px rounded-full font-semibold border border-gray-300 text-gray-500 hover:bg-gray-100"
              title="Waive payment (work trade / comp)" disabled={busy}
              onClick={() => { if (confirm("Waive payment for this booking? (work trade / comp — no money tracked)")) post({ op: "waive", kind, id: x.id, on: 1 }); }}>waive</button>
          </>;
        const payChip = (m: string | null) => m && m !== "waived" ?
          <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " +
            (m === "pack" ? "bg-ea-gold/40 text-ea-olive" : m === "venmo" ? "bg-sky-100 text-sky-800" : m === "external" ? "bg-ea-olive/15 text-ea-olive" : "bg-emerald-100 text-emerald-800")}>{m === "external" ? "pays instructor" : m}</span> : null;
        return (
          <div key={p.email} className="border border-ea-accent/40 rounded-lg p-3 sm:p-4 mb-3 bg-white">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 border-b border-ea-accent/20">
              <strong className="text-lg">{p.name || p.email}</strong>
              <span className="text-sm opacity-60">{p.email}{p.phone ? " · " + p.phone : ""}</span>
              <span className="w-full sm:w-auto sm:ml-auto flex flex-wrap items-center justify-start sm:justify-end gap-2">
                <span className="text-sm font-semibold">{taken} visit{taken === 1 ? "" : "s"} this {scale}</span>
                <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (pack ? "bg-ea-cream text-ea-espresso" : "bg-black/5 text-black/50")}>
                  {pack ? `pack ${pack.remaining}` : "no pack"}
                </span>
                {p.credit > 0 && <span className="text-xs px-2 py-0.5 rounded-full font-semibold bg-ea-gold/40 text-ea-olive">${p.credit.toFixed(2)} credit</span>}
                {p.member_until && <span className={"text-xs px-2 py-0.5 rounded-full font-semibold " + (p.member_until >= today() ? "bg-ea-olive/20 text-ea-olive" : "bg-black/5 text-black/40")}
                  title={"$100/month — covers open gym + Community Jam" + ((p.memberships || []).length ? "; click × in Pack & payments to remove" : "")}>
                  {p.member_until >= today() ? `member thru ${p.member_until}` : `membership ended ${p.member_until}`}
                </span>}
                {owes && <details className="relative">
                  <summary className="text-xs px-2 py-0.5 rounded-full font-semibold bg-red-100 text-red-700 cursor-pointer list-none select-none">owes ▾</summary>
                  <div className="absolute right-0 mt-1 z-10 bg-white border border-red-200 rounded-lg shadow-lg p-2.5 text-xs w-60 font-normal">
                    <p className="font-semibold text-red-700 mb-1">Owes for:</p>
                    {unpaidOf(p).map((x: any, i: number) => (
                      <p key={i}>{fmtD(x.date)} {fmtT(x.time)} · {x.title || "Open Gym"} · ${x.price} <span className="opacity-60">({x.pay_method || "unpaid"})</span></p>))}
                    {pack && pack.remaining < 0 &&
                      <p>Class pack overdrawn by <strong>{-pack.remaining}</strong> class{pack.remaining === -1 ? "" : "es"} (${(-pack.remaining * 27.5).toFixed(2)})</p>}
                    {p.credit > 0 && <p className="text-ea-olive">− ${p.credit.toFixed(2)} credit on file</p>}
                    <p className="font-semibold border-t border-red-200 mt-1.5 pt-1">Total owed: ${owedOf(p).toFixed(2)}</p>

                  </div>
                </details>}
              </span>
            </div>
            {p.id && sugg[p.id] && (() => {
              const sg = sugg[p.id]!;
              const tot = sg.items.filter(i => i.cover).reduce((s, i) => s + i.price, 0);
              const setIt = (i: number, cover: boolean) => setSugg(x => ({ ...x, [p.id]: { items: sg.items.map((it, j) => j === i ? { ...it, cover } : it) } }));
              return (
                <div className="mt-2 rounded-lg border border-ea-gold bg-ea-gold/10 px-2.5 py-2 text-xs space-y-1.5">
                  <div className="font-semibold opacity-70">💡 ${p.credit.toFixed(2)} credit on file could cover unpaid bookings — confirm to apply:</div>
                  {sg.items.map((it, i) => (
                    <label key={it.kind + it.id} className="flex items-center gap-1.5 cursor-pointer">
                      <input type="checkbox" checked={it.cover} onChange={e => setIt(i, e.target.checked)} />
                      <span className={it.cover ? "" : "opacity-50"}>mark paid: {fmtD(it.date)} {fmtT(it.time)} · {it.title} · ${it.price}</span>
                    </label>
                  ))}
                  <div className="flex items-center gap-2 pt-0.5">
                    <button className="btn btn--accent text-xs !px-2.5 !py-1" disabled={busy || tot <= 0 || tot > p.credit}
                      onClick={() => post({ op: "apply_credit", user_id: p.id, settle: sg.items.filter(i => i.cover).map(i => ({ kind: i.kind, id: i.id })) })}>
                      ✓ Apply ${tot.toFixed(2)} credit
                    </button>
                    <button className="text-xs underline opacity-60 hover:opacity-100" onClick={() => setSugg(x => ({ ...x, [p.id]: null }))}>not now</button>
                    {tot > p.credit && <span className="text-red-700 font-semibold">⚠ exceeds available credit</span>}
                  </div>
                </div>
              );
            })()}
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-4 sm:gap-y-2 mt-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Activity</div>
                {taken === 0 && <div className="text-sm opacity-50">No visits this {scale}.</div>}
                {p.classes.map((c: any, i: number) => (
                  <div key={"c" + i} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="opacity-60 w-20 sm:w-24 shrink-0">{fmtD(c.date)}</span>
                    <span>{fmtT(c.time)} · {c.title}</span>{payChip(c.pay_method)}{payBtn(c, "class")}
                  </div>))}
                {p.opengym.map((o: any, i: number) => (
                  <div key={"o" + i} className="text-sm flex flex-wrap items-baseline gap-x-2 gap-y-0.5">
                    <span className="opacity-60 w-20 sm:w-24 shrink-0">{fmtD(o.date)}</span>
                    <span>{fmtT(o.time)} · {o.title || "Open Gym"} ($10)</span>{payChip(o.pay_method)}{payBtn(o, o._kind || "opengym")}
                  </div>))}
              </div>
              <div>
                <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Pack & payments</div>
                <div className="text-sm flex flex-wrap items-center gap-2">
                  {pack ? <span>Pack: <b>{pack.remaining}</b> left</span> : <em className="opacity-60">no class pack</em>}
                  {pack && p.id && p.packs[0] && <>
                    <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => post({ op: "adjust_pack", id: p.packs[0].id, delta: -1 })}>−1</button>
                    <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => post({ op: "adjust_pack", id: p.packs[0].id, delta: 1 })}>+1</button>
                  </>}
                </div>
                {p.payments.length > 0 && <div className="mt-2">
                  <div className="text-[11px] uppercase tracking-wide opacity-50 mb-0.5">Payments logged</div>
                  {p.payments.map((pm: any) => (
                    <div key={pm.id} className="text-sm flex flex-wrap items-center gap-x-2 gap-y-0.5 py-0.5 border-b border-ea-accent/15 last:border-0">
                      <span className="opacity-60 w-20 sm:w-24 shrink-0">{new Date(pm.date + "T00:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", year: "2-digit", timeZone: "UTC" })}</span>
                      <b className="w-14">${pm.amount}</b>
                      <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " + (pm.method === "venmo" ? "bg-sky-100 text-sky-800" : "bg-emerald-100 text-emerald-800")}>{pm.method}</span>
                      {pm.unallocated > 0 && <span className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-ea-gold/40 text-ea-olive" title="Not yet applied to a pack or booking">${pm.unallocated.toFixed(2)} unallocated</span>}
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
                {(p.memberships || []).length > 0 && <div className="mt-1 space-y-0.5">
                  {(p.memberships || []).map((m: any) => (
                    <div key={m.id} className="flex items-center gap-2 text-xs">
                      <span className={m.end_date >= today() ? "text-ea-olive font-semibold" : "opacity-50"}>membership {m.start_date} → {m.end_date}{m.price === 0 && " · waived (trade)"}</span>
                      <button className="underline text-red-700/70 hover:text-red-700" disabled={busy}
                        onClick={() => { if (confirm(`Remove membership ${m.start_date} → ${m.end_date}? (payment record stays)`)) post({ op: "delete_membership", id: m.id }); }}>×</button>
                    </div>))}
                </div>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {p.id && <button className="btn text-xs !px-2.5 !py-1" disabled={busy}
                    onClick={() => {
                      if (pend[p.id]) setPend(x => { const y = { ...x }; delete y[+p.id]; return y; });
                      else setP(p.id, { amount: "", method: "venmo", purpose: "" });
                    }}>{pend[p.id] ? "✕ discard payment" : "+ payment"}</button>}
                  {p.phone
                    ? <a className="btn text-xs !px-2.5 !py-1" href={`sms:${p.phone}?&body=${smsBody}`}>📱 text reminder</a>
                    : <span className="text-xs opacity-50 italic">no phone on file</span>}
                </div>
                {p.id && pend[p.id] && (() => {
                  const pd = pend[p.id];
                  const cur = (p.memberships || [])[0];
                  const memDef = cur && cur.end_date >= today() ? nextDay(cur.end_date) : today();
                  const amt = parseFloat(pd.amount) || 0;
                  const single = ["aerial", "flex", "opengym"].includes(pd.purpose);
                  const mine = single ? (pd.items || []).filter(i => matchP(i, pd.purpose)) : [];
                  const checked = mine.filter(i => i.cover).reduce((sum, i) => sum + i.price, 0);
                  const lo = amt - checked;
                  const setPurpose = (v: string) => {
                    const patch: any = { purpose: v };
                    if (v === "pack") patch.amount = "110";
                    if (v === "membership") { patch.amount = pd.method === "waived" ? "0" : "100"; patch.start = pd.start || memDef; }
                    setP(p.id, patch);
                    if (["aerial", "flex", "opengym"].includes(v)) fetchItems(p.id, v);
                  };
                  return (
                    <div className="mt-2 rounded-lg border border-ea-gold bg-ea-gold/10 px-2.5 py-2 text-xs space-y-1.5">
                      <div className="flex flex-wrap items-center gap-1.5">
                        <span className="font-semibold opacity-70">Payment received: $</span>
                        <input inputMode="decimal" placeholder="0" value={pd.amount}
                          onChange={e => setP(p.id, { amount: e.target.value })}
                          className="w-16 border border-black/20 rounded px-1.5 py-0.5 bg-white" />
                        <span>via</span>
                        <select value={pd.method}
                          onChange={e => { const m = e.target.value; setP(p.id, { method: m, ...(pd.purpose === "membership" ? { amount: m === "waived" ? "0" : "100" } : {}) }); }}
                          className="border border-black/20 rounded px-1 py-0.5 bg-white">
                          <option value="venmo">venmo</option><option value="cash">cash</option>
                          {pd.purpose === "membership" && <option value="waived">waived (work trade)</option>}
                        </select>
                        <span className="font-semibold opacity-70 ml-1">for</span>
                        <select value={pd.purpose} onChange={e => setPurpose(e.target.value)}
                          className="border border-black/20 rounded px-1 py-0.5 bg-white">
                          <option value="">— what was it for? —</option>
                          <option value="pack">New class pack · 4 classes · $110</option>
                          <option value="membership">Open gym membership · $100/mo</option>
                          <option value="aerial">Single aerial class · $30</option>
                          <option value="flex">Single flex/flow class · $12</option>
                          <option value="opengym">Open gym / jam session · $10</option>
                          <option value="credit">Credit on file (decide later)</option>
                        </select>
                      </div>
                      {!pd.purpose && <div className="opacity-60 italic">Pick what the payment was for to enable saving.</div>}
                      {pd.purpose === "pack" && <div className="opacity-70">
                        Adds a fresh 4-class pack{amt > 0 && amt !== 110 ? ` — heads up: $${amt} is non-standard (pack is $110), still grants 4 classes` : " ($27.50/class)"}.
                      </div>}
                      {pd.purpose === "membership" && <div className="flex flex-wrap items-center gap-1.5">
                        <span>starts</span>
                        <input value={pd.start ?? memDef} onChange={e => setP(p.id, { start: e.target.value })}
                          className="w-28 border border-black/20 rounded px-1.5 py-0.5 bg-white" />
                        <span className="opacity-60">runs 1 month · covers open gym + Community Jam only{cur && cur.end_date >= today() ? " · extends current membership" : ""}</span>
                      </div>}
                      {single && <div className="space-y-1">
                        {mine.length > 0 ? <>
                          <div className="opacity-70">Applies to (uses each booking's real price — guest classes may differ):</div>
                          {mine.map(it => (
                            <label key={it.kind + it.id} className="flex items-center gap-1.5 cursor-pointer">
                              <input type="checkbox" checked={it.cover} onChange={e => toggleItem(p.id, pd, it, e.target.checked)} />
                              <span className={it.cover ? "" : "opacity-50"}>{fmtD(it.date)} {fmtT(it.time)} · {it.title || "Open Gym"} · ${it.price}</span>
                            </label>))}
                        </> : pd.items
                          ? <div className="opacity-60 italic">No unpaid booking of that type on file — saved as credit and applied when they book.</div>
                          : <div className="opacity-60 italic">loading their unpaid bookings…</div>}
                        {mine.some(i => i.cover) && Math.abs(lo) > 0.004 && (
                          <div className={lo < 0 ? "text-red-700 font-semibold" : "opacity-60"}>
                            {lo < 0 ? `⚠ $${Math.abs(lo).toFixed(2)} short of the selected bookings — the last ones stay unpaid`
                              : `$${lo.toFixed(2)} extra stays on file as credit`}
                          </div>)}
                      </div>}
                      {pd.purpose === "credit" && <div className="opacity-70">${amt > 0 ? amt.toFixed(2) : "…"} stays on file as credit (shown on their card + account) — apply it to bookings anytime.</div>}
                    </div>
                  );
                })()}
              </div>
            </div>
          </div>
        );
      });
      })()}
      {pendIds.length > 0 && (
        <div className="sticky bottom-4 z-20 mt-4 flex items-center justify-center gap-3">
          <div className="bg-ea-espresso text-white rounded-xl shadow-lg px-4 py-2.5 flex items-center gap-3">
            <span className="text-sm">{pendIds.length} payment{pendIds.length === 1 ? "" : "s"} pending</span>
            <button className="btn btn--accent text-xs !px-3 !py-1.5" disabled={busy} onClick={saveAll}>
              {busy ? "Saving…" : `Save ${pendIds.length === 1 ? "payment" : "all payments"}`}
            </button>
            <button className="text-xs underline opacity-70 hover:opacity-100" disabled={busy}
              onClick={() => setPend({})}>discard</button>
          </div>
        </div>
      )}
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
  const [tab, setTab] = useState<"schedule" | "tally" | "email" | "trends">("tally");
  return (
    <section className="container py-8">
      <h1 className="font-serif text-3xl mb-4">Studio Admin</h1>
      <div className="flex flex-wrap gap-2 mb-6">
        {([["tally", "Members & Payments"], ["trends", "Trends (90 Days)"], ["schedule", "Schedule Editor"], ["email", "Email"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"px-4 py-2 sm:px-6 sm:py-2.5 text-sm sm:text-base rounded-full font-semibold tracking-wide transition-colors " +
              (tab === k ? "bg-ea-espresso text-ea-paper shadow" : "bg-ea-cream/70 text-ea-espresso/70 hover:bg-ea-cream")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "tally" ? <TallyTab /> : tab === "trends" ? <TrendsTab /> : tab === "email" ? <EmailTab /> : <ScheduleTab />}
    </section>
  );
}
