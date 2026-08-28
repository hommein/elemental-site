import { me } from "../lib/user";
import { openGcal } from "../lib/cal";
import { useEffect, useMemo, useState } from "react";

type Cls = {
  id: number; title: string; instructor: string | null; day: number; time: string;
  duration_min: number; category: string; pricing: string; capacity: number; room: string;
  date: string; taken: number;
};
type Og = { date: string; time: string; room: string; n: number };
type Sched = { week: string; dates: string[]; classes: Cls[]; opengym: Og[] };
const ROOMS = ["Sun Room", "Foyer"];
const OG_CAP = 2; // per room per hour

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const GUESTS = new Set(["Bethany", "Mel", "Daniel", "Kelsey"]);
const GROUPS: Record<string, string> = {
  aerial: "bg-[#f0bd65] border-[#9f664a]",
  flex: "bg-[#e9cbb1] border-[#bd8f71]",
  guest: "bg-[#ded4b2] border-[#7f6436]",
  selah: "bg-white border-black/25",
  jam: "bg-[linear-gradient(135deg,#f5b8b8_0%,#f6d9a8_25%,#cfe3b8_50%,#b8d6ec_75%,#d9c2e8_100%)] border-black/20",
};
const GROUP_LABEL: [string, string][] = [
  ["Aerial", "aerial"], ["Flex", "flex"], ["Guest Instructors", "guest"], ["Selah Dance", "selah"],
];
const groupOf = (c: { title: string; category: string; instructor: string | null }) =>
  c.category === "selah" ? "selah"
  : c.title === "Community Jam" ? "jam"
  : c.category === "flex" ? "flex"
  : c.title === "Belly Dance" || (c.instructor && GUESTS.has(c.instructor)) ? "guest"
  : "aerial";

const SELAH_URL = "https://selah.dance/classes-and-workshops";
const toMin = (t: string) => { const [h, m] = t.split(":").map(Number); return h * 60 + m; };

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}
function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
}
function localISO(d: Date) {
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
function curSunday() {
  const d = new Date();
  d.setDate(d.getDate() - d.getDay());
  return localISO(d);
}
function shiftWeek(sunday: string, by: number) {
  const d = new Date(sunday + "T00:00:00Z");
  d.setUTCDate(d.getUTCDate() + by * 7);
  return d.toISOString().slice(0, 10);
}

export default function Classes() {
  const [data, setData] = useState<Sched | null>(null);
  const [week, setWeek] = useState<string | null>(null);
  const [sel, setSel] = useState<Cls | null>(null);
  const [ogDay, setOgDay] = useState<number | null>(null);
  const [err, setErr] = useState("");
  const [mDay, setMDay] = useState<number | "all">(new Date().getDay());
  const [tick, setTick] = useState(0);
  const [showBk, setShowBk] = useState(false);

  useEffect(() => {
    setErr("");
    fetch("/api/schedule" + (week ? `?week=${week}` : ""))
      .then(r => r.json())
      .then(setData)
      .catch(() => setErr("Couldn't load the schedule — please try again."));
  }, [week, tick]);

  const byDay = useMemo(() => {
    const m: Cls[][] = [[], [], [], [], [], [], []];
    data?.classes.forEach(c => m[c.day].push(c));
    return m;
  }, [data]);

  const [t0, t1] = useMemo(() => {
    let a = Infinity, b = -Infinity;
    data?.classes.forEach(c => { const s = toMin(c.time); a = Math.min(a, s); b = Math.max(b, s + c.duration_min); });
    if (!isFinite(a)) return [480, 1260];
    return [Math.min(480, Math.floor(a / 60) * 60), Math.max(1260, Math.ceil(b / 60) * 60)];
  }, [data]);
  const gridH = `${((t1 - t0) / 30) * 2.25}rem`;
  const hours = useMemo(() => {
    const out: number[] = [];
    for (let h = t0 / 60; h <= t1 / 60; h++) out.push(h);
    return out;
  }, [t0, t1]);

  // absolute placement within a day column; side-by-side lanes when times overlap
  function placed(list: Cls[]) {
    const sorted = [...list].sort((a, b) => toMin(a.time) - toMin(b.time));
    const spans = sorted.map(c => ({ c, s: toMin(c.time), e: toMin(c.time) + c.duration_min }));
    const laneEnd = [0, 0];
    return spans.map(({ c, s, e }) => {
      const lane = laneEnd[0] <= s ? 0 : 1;
      laneEnd[lane] = e;
      const crowded = spans.some(o => o.c !== c && o.s < e && o.e > s);
      return {
        c,
        top: `${((s - t0) / 30) * 2.25}rem`,
        h: `calc(${((e - s) / 30) * 2.25}rem - 3px)`,
        left: crowded && lane === 1 ? "50%" : "0",
        width: crowded ? "50%" : "100%",
      };
    });
  }

  const todayISO = localISO(new Date());
  const isCurrent = data ? data.week === curSunday() : !week;

  return (
    <section className="container py-10">
      <h1 className="font-serif text-4xl mb-2">Classes &amp; Schedule</h1>
      <p className="max-w-2xl text-ea-espresso/80 mb-6">
        Aerial for all levels, flexibility &amp; handstands, flow arts, and dance.
        All classes are one hour. Aerial classes are $30 drop-in or $110 for a 4-pack;
        flex &amp; flow classes are donation-based ($12 suggested).
        Open Gym is $10 per session — or unlimited with an Open Gym membership.
      </p>

      {/* week switcher */}
      <div className="flex items-center gap-2 mb-4">
        <button aria-label="Previous week" className="btn px-3.5 py-1.5 text-lg leading-none"
          onClick={() => data && setWeek(shiftWeek(data.week, -1))}>&lsaquo;</button>
        <div className="flex-1 sm:flex-none sm:w-60 text-center">
          <div className="font-serif text-xl leading-tight">
            {data ? (isCurrent ? "This Week" : `Week of ${prettyDate(data.dates[0])}`) : "Loading…"}
          </div>
          <div className="text-xs text-ea-espresso/60">
            {data ? `${prettyDate(data.dates[0])} – ${prettyDate(data.dates[6])}` : "\u00a0"}
          </div>
        </div>
        <button aria-label="Next week" className="btn px-3.5 py-1.5 text-lg leading-none"
          onClick={() => data && setWeek(shiftWeek(data.week, 1))}>&rsaquo;</button>
        {!isCurrent && (
          <button className="text-sm underline text-ea-olive whitespace-nowrap"
            onClick={() => setWeek(null)}>back to this week</button>
        )}
      </div>
      <div className="text-center mb-5 -mt-2">
        <button className="text-sm underline text-ea-espresso/70 hover:text-ea-olive"
          onClick={() => setShowBk(true)}>My bookings / cancel</button>
      </div>

      {/* mobile day picker */}
      <div className="lg:hidden mb-5 grid grid-cols-8 gap-1">
        {DAYS.map((d, i) => {
          const isToday = data?.dates[i] === todayISO;
          const on = mDay === i;
          return (
            <button key={d} onClick={() => setMDay(i)}
              className={`rounded-lg py-1.5 border text-center transition
                ${on ? "bg-ea-espresso text-white border-ea-espresso" : "border-ea-accent/40 hover:bg-ea-accent/10"}`}>
              <span className="block text-[10px] leading-none opacity-70">{d.slice(0, 3)}</span>
              <span className={`block text-sm font-medium ${!on && isToday ? "underline underline-offset-2" : ""}`}>
                {data ? Number(data.dates[i].slice(8, 10)) : "·"}
              </span>
            </button>
          );
        })}
        <button onClick={() => setMDay("all")}
          className={`rounded-lg py-1.5 border text-sm transition
            ${mDay === "all" ? "bg-ea-espresso text-white border-ea-espresso" : "border-ea-accent/40 hover:bg-ea-accent/10"}`}>
          All
        </button>
      </div>

      <div className="flex flex-wrap gap-2 mb-5 text-xs">
        {GROUP_LABEL.map(([label, k]) => (
          <span key={k} className={`border rounded-full px-2.5 py-0.5 ${GROUPS[k]}`}>{label}</span>
        ))}
      </div>

      {err && <p className="text-red-700">{err}</p>}

      {/* ---- mobile: stacked day lists ---- */}
      <div className="grid gap-4 md:grid-cols-2 lg:hidden">
        {DAYS.map((d, i) => (mDay === "all" || mDay === i) && (
          <div key={d}>
            <h3 className="font-serif text-lg border-b border-ea-accent/50 pb-1 mb-2">
              {d} <span className="text-sm text-ea-espresso/60">{data && prettyDate(data.dates[i])}</span>
              {data?.dates[i] === todayISO && <span className="ml-2 text-xs bg-ea-gold/40 rounded-full px-2 py-0.5 align-middle">today</span>}
            </h3>
            <div className="flex flex-col gap-2">
              <button onClick={() => setOgDay(i)}
                className="text-left border border-dashed border-ea-olive/50 rounded-lg px-2.5 py-2 text-sm text-ea-olive hover:bg-ea-olive/10">
                + Book Open Gym
              </button>
              {byDay[i].map(c => <Tile key={c.id} c={c} onPick={() => setSel(c)} />)}
              {byDay[i].length === 0 && <p className="text-sm text-ea-espresso/50">—</p>}
            </div>
          </div>
        ))}
      </div>

      {/* ---- desktop: chronological time grid ---- */}
      <div className="hidden lg:grid gap-x-1.5"
        style={{ gridTemplateColumns: "3.2rem repeat(7, minmax(0, 1fr))" }}>
        <div />
        {DAYS.map((d, i) => (
          <h3 key={d} className="font-serif text-base border-b border-ea-accent/50 pb-1 mb-1 text-center">
            {d}<span className="block text-xs font-sans text-ea-espresso/60">{data && prettyDate(data.dates[i])}</span>
          </h3>
        ))}

        {/* aligned open-gym row (top) */}
        <div />
        {DAYS.map((_, i) => (
          <button key={"og" + i} onClick={() => setOgDay(i)}
            className="mb-2 border border-dashed border-ea-olive/50 rounded-lg px-2 py-1.5 text-xs text-ea-olive hover:bg-ea-olive/10">
            + Book Open Gym
          </button>
        ))}

        {/* hour gutter */}
        <div className="relative" style={{ height: gridH }}>
          {hours.map(h => (
            <span key={h} className="absolute right-1 -translate-y-1/2 text-[11px] text-ea-espresso/50"
              style={{ top: `${((h * 60 - t0) / 30) * 2.25}rem` }}>{fmt(String(h) + ":00")}</span>
          ))}
        </div>

        {/* day columns */}
        {DAYS.map((_, i) => (
          <div key={i} className="relative rounded-md"
            style={{ height: gridH, backgroundImage: "repeating-linear-gradient(to bottom, rgba(0,0,0,.07) 0 1px, transparent 1px 4.5rem)" }}>
            {placed(byDay[i]).map(({ c, top, h, left, width }) => (
              <div key={c.id} className="absolute px-px" style={{ top, height: h, left, width }}>
                <Tile c={c} abs onPick={() => setSel(c)} />
              </div>
            ))}
          </div>
        ))}

      </div>

      {sel && <SignupModal cls={sel} onClose={(changed) => { setSel(null); if (changed) setTick(t => t + 1); }} />}
      {ogDay !== null && data && (
        <OpenGymModal day={ogDay} data={data}
          onClose={(changed) => { setOgDay(null); if (changed) setTick(t => t + 1); }} />
      )}
      {showBk && <MyBookingsModal onClose={(changed) => { setShowBk(false); if (changed) setTick(t => t + 1); }} />}
    </section>
  );
}

type Bk = { kind: "class" | "opengym"; id: number; date: string; time: string; title: string; instructor?: string; room?: string; can_cancel: boolean };

function MyBookingsModal({ onClose }: { onClose: (changed: boolean) => void }) {
  const [email, setEmail] = useState("");
  const [rows, setRows] = useState<Bk[] | null>(null);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const [changed, setChanged] = useState(false);

  useEffect(() => { me().then(u => { if (u) { setEmail(u.email); load(undefined, u.email); } }); }, []);

  async function load(e?: React.FormEvent, em?: string) {
    e?.preventDefault();
    setBusy(true); setMsg("");
    const r = await fetch("/api/bookings?email=" + encodeURIComponent((em ?? email).trim()));
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(j.error || "Something went wrong."); return; }
    setRows(j.bookings);
  }

  async function cancel(b: Bk) {
    if (!confirm(`Cancel ${b.title} on ${prettyDate(b.date)} at ${fmt(b.time)}?`)) return;
    setBusy(true); setMsg("");
    const r = await fetch("/api/cancel", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ kind: b.kind, id: b.id, email: email.trim() }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) { setMsg(j.error || "Could not cancel."); return; }
    setChanged(true);
    load();
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onClose(changed)}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-serif text-2xl mb-1">My Bookings</h3>
        <p className="text-sm text-ea-espresso/70 mb-4">
          Enter the email you booked with. Bookings can be cancelled up to 12 hours before the session. Within 12 hours, text us at (805) 364-2037.
        </p>
        <form onSubmit={load} className="flex gap-2 mb-4">
          <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
            className="border border-black/20 rounded-lg px-3 py-2 flex-1 min-w-0" />
          <button className="btn btn--accent" disabled={busy}>{busy ? "…" : "Find"}</button>
        </form>
        {msg && <p className="text-sm text-red-700 mb-3">{msg}</p>}
        {rows && (rows.length === 0
          ? <p className="text-sm text-ea-espresso/60">No upcoming bookings for that email.</p>
          : <div className="flex flex-col gap-1.5">
              {rows.map(b => (
                <div key={b.kind + b.id} className="border border-black/10 rounded-lg px-3 py-2 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <div className="text-sm font-medium truncate">{b.title}{b.instructor ? ` · ${b.instructor}` : ""}</div>
                    <div className="text-xs text-ea-espresso/60">{prettyDate(b.date)} · {fmt(b.time)}</div>
                  </div>
                  {b.can_cancel
                    ? <button className="text-sm underline text-red-700 whitespace-nowrap" disabled={busy}
                        onClick={() => cancel(b)}>Cancel</button>
                    : <a href="sms:+18053642037" className="text-xs text-ea-espresso/60 whitespace-nowrap underline">&lt;12h — text (805)&nbsp;364-2037</a>}
                </div>
              ))}
            </div>)}
        <button className="btn w-full mt-4" onClick={() => onClose(changed)}>Close</button>
      </div>
    </div>
  );
}

function Tile({ c, onPick, abs }: { c: Cls; onPick: () => void; abs?: boolean }) {
  const full = c.taken >= c.capacity;
  const ext = c.pricing === "external";
  const cls = `text-left border rounded-lg overflow-hidden transition block
    ${abs ? "h-full w-full px-1.5 py-1 text-xs leading-tight" : "px-2.5 py-2 text-sm"}
    ${GROUPS[groupOf(c)]}
    ${ext ? "hover:shadow-md" : "hover:shadow-md"}`;
  const body = (
    <>
      <div className="font-medium leading-tight truncate">{c.title}</div>
      <div className={`text-ea-espresso/70 truncate ${abs ? "text-[11px]" : "text-xs"}`}>
        {fmt(c.time)}{c.instructor ? ` · ${c.instructor}` : ""}{abs ? "" : ` · ${c.room}`}
      </div>
      {ext
        ? <div className={`italic ${abs ? "text-[11px]" : "text-xs mt-0.5"}`}>via Selah Dance ↗</div>
        : <div className={`${abs ? "text-[11px]" : "text-xs mt-0.5"} ${full ? "text-red-700" : "text-ea-olive"}`}>
            {full ? "Full" : `${c.capacity - c.taken}/${c.capacity} open`}
          </div>}
    </>
  );
  return ext
    ? <a href={SELAH_URL} target="_blank" rel="noreferrer" className={cls}>{body}</a>
    : <button onClick={onPick} className={cls}>{body}</button>;
}

function SignupModal({ cls, onClose }: { cls: Cls; onClose: (changed: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");
  useEffect(() => { me().then(u => { if (u) { setName(n => n || u.name); setEmail(e => e || u.email); } }); }, []);


  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setState("busy"); setMsg("");
    const r = await fetch("/api/signup", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ class_id: cls.id, date: cls.date, name, email }),
    });
    const j = await r.json();
    if (r.ok) { setState("done"); setMsg(`You're in! ${j.spots_left} spot${j.spots_left === 1 ? "" : "s"} left.`); }
    else { setState("idle"); setMsg(j.error || "Something went wrong."); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4"
      onClick={() => onClose(state === "done")}>
      <div className="bg-white rounded-xl p-6 w-full max-w-sm shadow-xl" onClick={e => e.stopPropagation()}>
        <h3 className="font-serif text-2xl mb-1">{cls.title}</h3>
        <p className="text-sm text-ea-espresso/70 mb-4">
          {DAYS[cls.day]} {prettyDate(cls.date)} at {fmt(cls.time)}
          {cls.instructor ? ` with ${cls.instructor}` : ""}
        </p>
        {state === "done" ? (
          <>
            <p className="text-ea-olive font-medium mb-4">{msg}</p>
            <button className="btn w-full mb-2" onClick={() =>
              openGcal(cls.title, cls.date, cls.time, cls.duration_min || 60,
                cls.instructor ? `Instructor: ${cls.instructor}` : "")}>
              📅 Add to Google Calendar
            </button>
            <button className="btn btn--accent w-full" onClick={() => onClose(true)}>Done</button>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <input required placeholder="Your name" value={name} onChange={e => setName(e.target.value)}
              className="border border-black/20 rounded-lg px-3 py-2" />
            <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)}
              className="border border-black/20 rounded-lg px-3 py-2" />
            {msg && <p className="text-sm text-red-700">{msg}</p>}
            <button className="btn btn--accent" disabled={state === "busy"}>
              {state === "busy" ? "Signing up…" : "Sign Up"}
            </button>
            <p className="text-xs text-ea-espresso/60">12-hour cancellation policy. Pay in studio — cash or Venmo.</p>
          </form>
        )}
      </div>
    </div>
  );
}

function OpenGymModal({ day, data, onClose }: { day: number; data: Sched; onClose: (changed: boolean) => void }) {
  const date = data.dates[day];
  const [slot, setSlot] = useState<string | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");
  useEffect(() => { me().then(u => { if (u) { setName(n => n || u.name); setEmail(e => e || u.email); } }); }, []);


  const slots = useMemo(() => {
    const cls = data.classes.filter(c => c.day === day);
    const out: { time: string; left: number }[] = [];
    for (let h = 8; h <= 20; h++) {
      const t = String(h).padStart(2, "0") + ":00";
      let left = 0;
      for (const room of ROOMS) {
        const busy = cls.some(c => {
          if (c.room !== room) return false;
          const [ch, cm] = c.time.split(":").map(Number);
          const start = ch * 60 + cm;
          return start < (h + 1) * 60 && start + c.duration_min > h * 60;
        });
        if (busy) continue;
        const n = data.opengym.find(o => o.date === date && o.time === t && o.room === room)?.n || 0;
        left += Math.max(0, OG_CAP - n);
      }
      out.push({ time: t, left });
    }
    return out;
  }, [data, day, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setState("busy"); setMsg("");
    const r = await fetch("/api/opengym", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ date, time: slot, name, email }),
    });
    const j = await r.json();
    if (r.ok) { setState("done"); setMsg("You're booked! See you there."); }
    else { setState("idle"); setMsg(j.error || "Something went wrong."); }
  }

  return (
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center p-4" onClick={() => onClose(state === "done")}>
      <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-xl max-h-[85vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
        <h3 className="font-serif text-2xl mb-1">Open Gym — {DAYS[day]} {prettyDate(date)}</h3>
        <p className="text-sm text-ea-espresso/70 mb-4">
          Train independently in any open one-hour slot. $10 per session, or free with an
          Open Gym membership. Pick a time:
        </p>
        {state === "done" ? (
          <>
            <p className="text-ea-olive font-medium mb-4">{msg}</p>
            {slot && <button className="btn w-full mb-2" onClick={() => openGcal("Open Gym", date, slot, 60)}>
              📅 Add to Google Calendar
            </button>}
            <button className="btn btn--accent w-full" onClick={() => onClose(true)}>Done</button>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="flex flex-col gap-1">
              {slots.map(sl => {
                const on = slot === sl.time;
                const off = sl.left === 0;
                return (
                  <button type="button" key={sl.time} disabled={off}
                    onClick={() => setSlot(sl.time)}
                    className={`border rounded-lg px-3 py-1 text-sm flex items-center justify-between ${
                      off ? "bg-black/5 border-black/10 text-black/35 cursor-not-allowed"
                        : on ? "bg-ea-olive text-white border-ea-olive"
                        : "border-black/15 hover:border-ea-olive/60"}`}>
                    <span>{fmt(sl.time)}</span>
                    <span className={`text-xs ${off ? "text-black/30" : on ? "text-white/80" : "text-ea-espresso/60"}`}>
                      {off ? "unavailable" : `${sl.left} spot${sl.left === 1 ? "" : "s"}`}
                    </span>
                  </button>
                );
              })}
              {slots.every(s => s.left === 0) && <p className="text-sm text-ea-espresso/60">No open slots this day.</p>}
            </div>
            <input required placeholder="Your name" value={name} onChange={e => setName(e.target.value)} className="border border-black/20 rounded-lg px-3 py-2" />
            <input required type="email" placeholder="Email" value={email} onChange={e => setEmail(e.target.value)} className="border border-black/20 rounded-lg px-3 py-2" />
            {msg && <p className="text-sm text-red-700">{msg}</p>}
            <button className="btn btn--accent" disabled={state === "busy" || !slot}>{state === "busy" ? "Booking…" : "Book Open Gym"}</button>
          </form>
        )}
      </div>
    </div>
  );
}
