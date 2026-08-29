import { useEffect, useRef, useState } from "react";

const EMOJIS = ["😊","😄","🥳","🤸","🧘","💪","🔥","✨","🌟","⭐","🎉","🎊","❤️","🧡","💛","💚","💙","💜","🤍","🙌","👏","🙏","👍","💃","🕺","🎪","🎭","🩰","🌙","☀️","🌈","🌸","🌺","🍂","🎃","🎄","🎁","⏰","📅","📣","💌","✅","❗","❓","➡️","👉","🆕","🆓"];

const today = () => new Date(Date.now() - 8 * 3600e3).toISOString().slice(0, 10);
const nextDay = (d: string) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + 1); return x.toISOString().slice(0, 10); };
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
// canonical pack balance: SUM(remaining) across ALL packs (null = never had a pack).
// Must match /api/pack "balance" and signup.ts pack_remaining — one number everywhere.
const pkBal = (p: any): number | null =>
  p.packs && p.packs.length ? p.packs.reduce((s: number, k: any) => s + k.remaining, 0) : null;
// canonical "unpaid bookings" + "owes money" — the ONLY definitions; stat cards and
// member-card badges must always agree.
const unpaidOf = (p: any) => [...p.classes, ...p.opengym].filter((x: any) => x.billable && !x.paid);
const owesOf = (p: any) => { const b = pkBal(p); return (b != null && b < 0) || unpaidOf(p).length > 0; };


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
      <span className="w-32 truncate text-right text-ea-espresso/70">{it.label}</span>
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
  type PlanItem = { kind: string; id: number; date: string; time: string; title: string; price: number; cover: boolean };
  type Pend = { amount: string; method: string; plan?: { credits: number; items: PlanItem[]; credit: number } };
  const [pend, setPend] = useState<Record<number, Pend>>({});
  const setP = (id: number, patch: any) => setPend(x => ({ ...x, [id]: { ...{ amount: "", method: "venmo" }, ...x[id], ...patch } }));
  const pendIds = Object.keys(pend).filter(k => parseFloat(pend[+k]?.amount) > 0).map(Number);
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
  const preview = async (id: number) => {
    const amt = parseFloat(pend[id]?.amount);
    if (!(amt > 0)) return;
    const r = await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ op: "preview_payment", user_id: id, amount: amt }) }).then(r => r.json());
    setP(id, { plan: { credits: r.credits, items: r.items, credit: r.credit || 0 } });
  };
  const leftover = (pd: Pend) => {
    if (!pd.plan) return 0;
    return (parseFloat(pd.amount) || 0) + (pd.plan.credit || 0) - pd.plan.credits * 27.5
      - pd.plan.items.filter(i => i.cover).reduce((s, i) => s + i.price, 0);
  };
  const saveAll = async () => {
    setBusy(true);
    for (const id of pendIds) {
      const pd = pend[id];
      const body: any = { op: "add_payment", user_id: id, amount: parseFloat(pd.amount), method: pd.method };
      if (pd.plan) body.plan = { credits: pd.plan.credits, settle: pd.plan.items.filter(i => i.cover).map(i => ({ kind: i.kind, id: i.id })) };
      await fetch("/api/admin/people", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    }
    setPend({}); await load(); setBusy(false);
  };

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
          (owes ? ` Please Venmo Katelyn (note: "Aerial") or bring cash for the balance. ${VENMO}` : " You're all set!"));
        const fmtD = (d: string) => new Date(d + "T00:00:00Z").toLocaleString("en-US", { weekday: "short", month: "short", day: "numeric", timeZone: "UTC" });
        const fmtT = (t: string) => { const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`; };
        const payBtn = (x: any, kind: string) => !x.billable ? null : x.paid ?
          <button className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-emerald-100 text-emerald-800"
            title="Click to mark unpaid" disabled={busy}
            onClick={() => post({ op: "mark_paid", kind, id: x.id, paid: 0 })}>paid ✓</button> :
          <>
            <span className="text-[10px] px-1.5 py-px rounded-full font-semibold bg-red-100 text-red-700">owes</span>
            <button className="text-[10px] px-1.5 py-px rounded-full font-semibold border border-emerald-400 text-emerald-700 hover:bg-emerald-50"
              disabled={busy} onClick={() => post({ op: "mark_paid", kind, id: x.id, paid: 1 })}>mark paid</button>
          </>;
        const payChip = (m: string | null) => m ?
          <span className={"text-[10px] px-1.5 py-px rounded-full font-semibold " +
            (m === "pack" ? "bg-ea-gold/40 text-ea-olive" : m === "venmo" ? "bg-sky-100 text-sky-800" : m === "external" ? "bg-ea-olive/15 text-ea-olive" : "bg-emerald-100 text-emerald-800")}>{m === "external" ? "pays instructor" : m}</span> : null;
        return (
          <div key={p.email} className="border border-ea-accent/40 rounded-lg p-4 mb-3 bg-white">
            <div className="flex flex-wrap items-center gap-x-3 gap-y-1 pb-2 border-b border-ea-accent/20">
              <strong className="text-lg">{p.name || p.email}</strong>
              <span className="text-sm opacity-60">{p.email}{p.phone ? " · " + p.phone : ""}</span>
              <span className="ml-auto flex items-center gap-2">
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
                    {pack && pack.remaining < 0 &&
                      <p className="mb-1">Class pack overdrawn by <strong>{-pack.remaining}</strong> class{pack.remaining === -1 ? "" : "es"}</p>}
                    {p.classes.filter((c: any) => c.pay_method !== "pack" && !c.paid).map((c: any, i: number) => (
                      <p key={"c" + i}>{fmtD(c.date)} {fmtT(c.time)} · {c.title} <span className="opacity-60">({c.pay_method || "unpaid"})</span></p>))}
                    {p.opengym.filter((o: any) => o.pay_method !== "pack" && !o.paid).map((o: any, i: number) => (
                      <p key={"o" + i}>{fmtD(o.date)} {fmtT(o.time)} · {o.title || "Open Gym"} $10 <span className="opacity-60">({o.pay_method || "unpaid"})</span></p>))}

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
            <div className="grid sm:grid-cols-2 gap-x-6 gap-y-2 mt-2">
              <div>
                <div className="text-[11px] uppercase tracking-wide opacity-50 mb-1">Activity</div>
                {taken === 0 && <div className="text-sm opacity-50">No visits this {scale}.</div>}
                {p.classes.map((c: any, i: number) => (
                  <div key={"c" + i} className="text-sm flex items-baseline gap-2">
                    <span className="opacity-60 w-24 shrink-0">{fmtD(c.date)}</span>
                    <span>{fmtT(c.time)} · {c.title}</span>{payChip(c.pay_method)}{payBtn(c, "class")}
                  </div>))}
                {p.opengym.map((o: any, i: number) => (
                  <div key={"o" + i} className="text-sm flex items-baseline gap-2">
                    <span className="opacity-60 w-24 shrink-0">{fmtD(o.date)}</span>
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
                    <div key={pm.id} className="text-sm flex items-center gap-2 py-0.5 border-b border-ea-accent/15 last:border-0">
                      <span className="opacity-60 w-24 shrink-0">{new Date(pm.date + "T00:00:00Z").toLocaleString("en-US", { month: "short", day: "numeric", year: "2-digit", timeZone: "UTC" })}</span>
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
                      <span className={m.end_date >= today() ? "text-ea-olive font-semibold" : "opacity-50"}>membership {m.start_date} → {m.end_date}</span>
                      <button className="underline text-red-700/70 hover:text-red-700" disabled={busy}
                        onClick={() => { if (confirm(`Remove membership ${m.start_date} → ${m.end_date}? (payment record stays)`)) post({ op: "delete_membership", id: m.id }); }}>×</button>
                    </div>))}
                </div>}
                <div className="flex flex-wrap items-center gap-2 mt-2">
                  {p.id && <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => { const sz = prompt("Pack size?", "4"); if (sz) post({ op: "add_pack", user_id: p.id, size: +sz }); }}>+ new pack</button>}
                  {p.id && <button className="btn text-xs !px-2.5 !py-1" disabled={busy} onClick={() => {
                    const cur = (p.memberships || [])[0];
                    const def = cur && cur.end_date >= today() ? nextDay(cur.end_date) : today();
                    const st = prompt("Membership start date (YYYY-MM-DD)? $100, runs 1 month.", def); if (!st) return;
                    const m = prompt("Paid by? (venmo/cash)", "venmo") || "venmo";
                    post({ op: "add_membership", user_id: p.id, start: st, method: m });
                  }}>{(p.member_until && p.member_until >= today()) ? "renew membership" : "+ membership"}</button>}
                  {p.id && <span className={`inline-flex items-center gap-1 rounded-lg border px-1.5 py-1
                      ${parseFloat(pend[p.id]?.amount) > 0 ? "border-ea-gold bg-ea-gold/15" : "border-black/15"}`}>
                    <span className="text-xs opacity-60">+ payment $</span>
                    <input inputMode="decimal" placeholder="0" value={pend[p.id]?.amount || ""}
                      onChange={e => setP(p.id, { amount: e.target.value, plan: undefined })}
                      onBlur={() => preview(p.id)}
                      onKeyDown={e => { if (e.key === "Enter") preview(p.id); }}
                      className="w-14 border border-black/20 rounded px-1.5 py-0.5 text-xs bg-white" />
                    <select value={pend[p.id]?.method || "venmo"} onChange={e => setP(p.id, { method: e.target.value })}
                      className="border border-black/20 rounded px-1 py-0.5 text-xs bg-white">
                      <option value="venmo">venmo</option><option value="cash">cash</option>
                    </select>
                  </span>}
                  {p.phone
                    ? <a className="btn text-xs !px-2.5 !py-1" href={`sms:${p.phone}?&body=${smsBody}`}>📱 text reminder</a>
                    : <span className="text-xs opacity-50 italic">no phone on file</span>}
                </div>
                {p.id && pend[p.id]?.plan && parseFloat(pend[p.id].amount) > 0 && (() => {
                  const pd = pend[p.id]; const plan = pd.plan!;
                  const lo = leftover(pd);
                  const setPlan = (patch: any) => setP(p.id, { plan: { ...plan, ...patch } });
                  return (
                    <div className="mt-2 rounded-lg border border-ea-gold bg-ea-gold/10 px-2.5 py-2 text-xs space-y-1.5">
                      <div className="font-semibold opacity-70">How ${pd.amount} gets applied — confirm or adjust:</div>
                      {plan.credit > 0 && <div className="text-ea-olive">+ ${plan.credit.toFixed(2)} existing credit on file is included</div>}
                      <label className="flex items-center gap-1.5">
                        <span>Add</span>
                        <input inputMode="numeric" value={plan.credits}
                          onChange={e => setPlan({ credits: Math.max(0, parseInt(e.target.value) || 0) })}
                          className="w-10 border border-black/20 rounded px-1 py-0.5 bg-white text-center" />
                        <span>pack credits {plan.credits > 0 && <span className="opacity-50">(${(plan.credits * 27.5).toFixed(0)})</span>}</span>
                      </label>
                      {plan.items.length > 0 ? plan.items.map((it, i) => (
                        <label key={it.kind + it.id} className="flex items-center gap-1.5 cursor-pointer">
                          <input type="checkbox" checked={it.cover}
                            onChange={e => setPlan({ items: plan.items.map((x, j) => j === i ? { ...x, cover: e.target.checked } : x) })} />
                          <span className={it.cover ? "" : "opacity-50"}>mark paid: {fmtD(it.date)} {fmtT(it.time)} · {it.title} · ${it.price}</span>
                        </label>
                      )) : <div className="opacity-50 italic">no unpaid bookings</div>}
                      <div className={lo < 0 ? "text-red-700 font-semibold" : "opacity-60"}>
                        {lo < 0 ? `⚠ over-allocated by $${Math.abs(lo).toFixed(2)}` : `$${lo.toFixed(2)} stays on file as credit (shown on their card + account)`}
                      </div>
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
      <div className="flex gap-2 mb-6">
        {([["tally", "Members & Payments"], ["trends", "Trends (90 Days)"], ["schedule", "Schedule Editor"], ["email", "Email"]] as const).map(([k, label]) => (
          <button key={k} onClick={() => setTab(k)}
            className={"px-6 py-2.5 rounded-full font-semibold tracking-wide transition-colors " +
              (tab === k ? "bg-ea-espresso text-ea-paper shadow" : "bg-ea-cream/70 text-ea-espresso/70 hover:bg-ea-cream")}>
            {label}
          </button>
        ))}
      </div>
      {tab === "tally" ? <TallyTab /> : tab === "trends" ? <TrendsTab /> : tab === "email" ? <EmailTab /> : <ScheduleTab />}
    </section>
  );
}
