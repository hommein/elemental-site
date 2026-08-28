import { useEffect, useMemo, useState } from "react";

type Cls = {
  id: number; title: string; instructor: string | null; day: number; time: string;
  duration_min: number; category: string; pricing: string; capacity: number; room: string;
  date: string; taken: number;
};
type Og = { date: string; time: string; room: string; n: number };
type Sched = { week: string; dates: string[]; classes: Cls[]; opengym: Og[] };
const ROOMS = ["Sun Room", "Foyer"];
const OG_CAP = 4;

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const CAT: Record<string, string> = {
  aerial: "bg-ea-accent/15 border-ea-accent/40",
  flex: "bg-ea-gold/15 border-ea-gold/50",
  flow: "bg-ea-gold/15 border-ea-gold/50",
  dance: "bg-ea-brown/10 border-ea-brown/30",
  community: "bg-ea-olive/15 border-ea-olive/40",
  selah: "bg-black/5 border-black/15",
};

function fmt(t: string) {
  const [h, m] = t.split(":").map(Number);
  const ap = h >= 12 ? "pm" : "am";
  return `${((h + 11) % 12) + 1}${m ? ":" + String(m).padStart(2, "0") : ""}${ap}`;
}
function prettyDate(iso: string) {
  const d = new Date(iso + "T00:00:00");
  return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
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
  const [tick, setTick] = useState(0);

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

  return (
    <section className="container py-10">
      <h1 className="font-serif text-4xl mb-2">Classes &amp; Schedule</h1>
      <p className="max-w-2xl text-ea-espresso/80 mb-6">
        Aerial for all levels, flexibility &amp; handstands, flow arts, and dance.
        All classes are one hour. Aerial classes are $30 drop-in or $110 for a 4-pack;
        flex &amp; flow classes are donation-based ($12 suggested).
      </p>

      <div className="flex items-center gap-3 mb-6">
        <button className="btn" onClick={() => data && setWeek(shiftWeek(data.week, -1))}>&larr; Prev</button>
        <span className="font-medium">
          {data ? `Week of ${prettyDate(data.dates[0])} – ${prettyDate(data.dates[6])}` : "Loading…"}
        </span>
        <button className="btn" onClick={() => data && setWeek(shiftWeek(data.week, 1))}>Next &rarr;</button>
        {week && <button className="text-sm underline" onClick={() => setWeek(null)}>today</button>}
      </div>

      {err && <p className="text-red-700">{err}</p>}

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-7 lg:gap-2">
        {DAYS.map((d, i) => (
          <div key={d}>
            <h3 className="font-serif text-lg border-b border-ea-accent/50 pb-1 mb-2">
              {d} <span className="text-sm text-ea-espresso/60">{data && prettyDate(data.dates[i])}</span>
            </h3>
            <div className="flex flex-col gap-2">
              {byDay[i].map(c => {
                const full = c.taken >= c.capacity;
                return (
                  <button key={c.id}
                    onClick={() => c.pricing !== "external" && setSel(c)}
                    className={`text-left border rounded-lg px-2.5 py-2 text-sm transition
                      ${CAT[c.category] ?? "bg-black/5 border-black/10"}
                      ${c.pricing === "external" ? "cursor-default opacity-70" : "hover:shadow-md"}`}>
                    <div className="font-medium leading-tight">{c.title}</div>
                    <div className="text-xs text-ea-espresso/70">
                      {fmt(c.time)}{c.instructor ? ` · ${c.instructor}` : ""} · {c.room}
                    </div>
                    {c.pricing === "external"
                      ? <div className="text-xs italic mt-0.5">via Selah Dance</div>
                      : <div className={`text-xs mt-0.5 ${full ? "text-red-700" : "text-ea-olive"}`}>
                          {full ? "Full" : `${c.capacity - c.taken} of ${c.capacity} spots open`}
                        </div>}
                  </button>
                );
              })}
              {byDay[i].length === 0 && <p className="text-sm text-ea-espresso/50">—</p>}
              <button onClick={() => setOgDay(i)}
                className="text-left border border-dashed border-ea-olive/50 rounded-lg px-2.5 py-2 text-sm text-ea-olive hover:bg-ea-olive/10">
                + Book Open Gym
              </button>
            </div>
          </div>
        ))}
      </div>

      {sel && <SignupModal cls={sel} onClose={(changed) => { setSel(null); if (changed) setTick(t => t + 1); }} />}
      {ogDay !== null && data && (
        <OpenGymModal day={ogDay} data={data}
          onClose={(changed) => { setOgDay(null); if (changed) setTick(t => t + 1); }} />
      )}
    </section>
  );
}

function SignupModal({ cls, onClose }: { cls: Cls; onClose: (changed: boolean) => void }) {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");

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
  const [slot, setSlot] = useState<{ time: string; room: string } | null>(null);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [state, setState] = useState<"idle" | "busy" | "done">("idle");
  const [msg, setMsg] = useState("");

  const slots = useMemo(() => {
    const cls = data.classes.filter(c => c.day === day);
    const out: { time: string; room: string; left: number }[] = [];
    for (let h = 8; h <= 20; h++) {
      for (const room of ROOMS) {
        const busy = cls.some(c => {
          if (c.room !== room) return false;
          const [ch, cm] = c.time.split(":").map(Number);
          const start = ch * 60 + cm;
          return start < (h + 1) * 60 && start + c.duration_min > h * 60;
        });
        if (busy) continue;
        const t = String(h).padStart(2, "0") + ":00";
        const n = data.opengym.find(o => o.date === date && o.time === t && o.room === room)?.n || 0;
        if (n < OG_CAP) out.push({ time: t, room, left: OG_CAP - n });
      }
    }
    return out;
  }, [data, day, date]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!slot) return;
    setState("busy"); setMsg("");
    const r = await fetch("/api/opengym", {
      method: "POST", headers: { "content-type": "application/json" },
      body: JSON.stringify({ date, ...slot, name, email }),
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
          Train independently in any open one-hour slot. $30 drop-in or 4-pack. Pick a time &amp; room:
        </p>
        {state === "done" ? (
          <>
            <p className="text-ea-olive font-medium mb-4">{msg}</p>
            <button className="btn btn--accent w-full" onClick={() => onClose(true)}>Done</button>
          </>
        ) : (
          <form onSubmit={submit} className="flex flex-col gap-3">
            <div className="grid grid-cols-2 gap-1.5">
              {slots.map(sl => {
                const on = slot?.time === sl.time && slot?.room === sl.room;
                return (
                  <button type="button" key={sl.time + sl.room} onClick={() => setSlot({ time: sl.time, room: sl.room })}
                    className={`border rounded-lg px-2 py-1.5 text-sm text-left ${on ? "bg-ea-olive text-white border-ea-olive" : "border-black/15 hover:border-ea-olive/60"}`}>
                    {fmt(sl.time)} · {sl.room}
                    <span className={`block text-xs ${on ? "text-white/80" : "text-ea-espresso/60"}`}>{sl.left} spot{sl.left === 1 ? "" : "s"}</span>
                  </button>
                );
              })}
              {slots.length === 0 && <p className="col-span-2 text-sm text-ea-espresso/60">No open slots this day.</p>}
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
