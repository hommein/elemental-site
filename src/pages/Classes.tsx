import { useEffect, useMemo, useState } from "react";

type Cls = {
  id: number; title: string; instructor: string | null; day: number; time: string;
  duration_min: number; category: string; pricing: string; capacity: number;
  date: string; taken: number;
};
type Sched = { week: string; dates: string[]; classes: Cls[] };

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
                      {fmt(c.time)}{c.instructor ? ` · ${c.instructor}` : ""}
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
            </div>
          </div>
        ))}
      </div>

      {sel && <SignupModal cls={sel} onClose={(changed) => { setSel(null); if (changed) setTick(t => t + 1); }} />}
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
