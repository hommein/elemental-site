import { useEffect, useState } from "react";
import { me } from "../lib/user";

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const ptToday = () => new Date().toLocaleDateString("en-CA", { timeZone: "America/Los_Angeles" });
const shift = (d: string, n: number) => { const x = new Date(d + "T00:00:00Z"); x.setUTCDate(x.getUTCDate() + n); return x.toISOString().slice(0, 10); };
const pretty = (d: string) => { const x = new Date(d + "T00:00:00Z"); return `${DAYS[x.getUTCDay()]}, ${x.toLocaleDateString("en-US", { month: "long", day: "numeric", timeZone: "UTC" })}`; };
const fmt = (t: string) => { const [h, m] = t.split(":").map(Number); const ap = h >= 12 ? "pm" : "am"; return `${h % 12 || 12}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`; };

export default function Instructor() {
  const [user, setUser] = useState<any>(undefined);
  const [date, setDate] = useState(ptToday());
  const [data, setData] = useState<any>(null);
  const [mine, setMine] = useState(true);
  const [busy, setBusy] = useState<number | null>(null);

  useEffect(() => { me().then(u => { setUser(u || null); setMine(!!u?.instructor_name); }); }, []);
  const load = () => fetch(`/api/instructor/roster?date=${date}`).then(r => r.ok ? r.json() : null).then(setData);
  useEffect(() => { if (user) load(); }, [user, date]);

  if (user === undefined) return <section className="container py-8">Loading…</section>;
  if (!user) return <section className="container py-8"><p>Please <a className="underline" href="/account">log in</a> first.</p></section>;
  if (!user.is_admin && !user.is_instructor) return <section className="container py-8"><p>This page is for instructors. Ask the studio to turn on instructor access for your account.</p></section>;

  const myName = (user.instructor_name || "").toLowerCase();
  const all: any[] = (data?.classes || []).filter((c: any) => !c.cancelled);
  const list = mine && myName ? all.filter(c => (c.instructor || "").toLowerCase().includes(myName)) : all;

  const toggle = async (s: any) => {
    setBusy(s.id);
    await fetch("/api/instructor/roster", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ op: "checkin", id: s.id, on: s.checked_in ? 0 : 1 }) });
    await load(); setBusy(null);
  };

  return (
    <section className="container py-6 sm:py-8 max-w-2xl">
      <div className="flex flex-wrap items-center gap-2 mb-1">
        <h1 className="font-serif text-3xl">Instructor Check-In</h1>
        {user.is_admin && <a href="/admin" className="ml-auto text-sm underline opacity-70 hover:opacity-100">Switch to full admin view →</a>}
      </div>
      <p className="text-sm opacity-70 mb-4">Pick a day, open your class, tap a name to check them in.</p>

      <div className="flex items-center gap-2 mb-2">
        <button className="btn !px-3 !py-1.5" onClick={() => setDate(shift(date, -1))}>‹</button>
        <input type="date" className="rounded border border-ea-espresso/25 px-2 py-1.5 text-sm" value={date} onChange={e => e.target.value && setDate(e.target.value)} />
        <button className="btn !px-3 !py-1.5" onClick={() => setDate(shift(date, 1))}>›</button>
        {date !== ptToday() && <button className="text-sm underline" onClick={() => setDate(ptToday())}>today</button>}
      </div>
      <h2 className="font-serif text-xl mb-3">{pretty(date)}</h2>

      {myName && (
        <label className="flex items-center gap-2 text-sm mb-4 cursor-pointer">
          <input type="checkbox" checked={mine} onChange={e => setMine(e.target.checked)} />
          Only my classes ({user.instructor_name})
        </label>
      )}

      {!data ? <p>Loading…</p> : list.length === 0 ? <p className="opacity-70">No classes {mine && myName ? "for you " : ""}on this day.</p> : list.map(c => (
        <details key={c.id} open={list.length <= 3} className="border border-ea-accent/40 rounded-lg bg-white mb-3">
          <summary className="cursor-pointer px-4 py-3 flex flex-wrap items-center gap-x-3 gap-y-1">
            <span className="font-semibold">{fmt(c.time)}</span>
            <span className="font-serif text-lg">{c.title}</span>
            {c.instructor && <span className="text-sm opacity-60">with {c.instructor}</span>}
            <span className="ml-auto text-sm">
              {c.signups.filter((s: any) => s.checked_in).length}/{c.signups.length} here
              <span className="opacity-50"> · {c.room}</span>
            </span>
          </summary>
          <div className="px-4 pb-3 border-t border-ea-accent/20">
            {c.signups.length === 0 ? <p className="text-sm opacity-60 pt-3">No one signed up yet.</p> : (
              <ul className="divide-y divide-ea-accent/15">
                {c.signups.map((s: any) => (
                  <li key={s.id}>
                    <button disabled={busy === s.id} onClick={() => toggle(s)}
                      className={"w-full flex items-center gap-3 py-2.5 text-left " + (s.checked_in ? "text-ea-olive" : "")}>
                      <span className={"w-6 h-6 rounded-full border-2 flex items-center justify-center text-sm shrink-0 " + (s.checked_in ? "bg-ea-olive border-ea-olive text-white" : "border-ea-espresso/30")}>{s.checked_in ? "✓" : ""}</span>
                      <span className="font-medium">{s.name}</span>
                      <span className="text-xs opacity-50 ml-auto">{s.pay_method === "external" ? "pays you" : s.pay_method}{s.paid ? " · paid" : ""}</span>
                    </button>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </details>
      ))}
    </section>
  );
}
