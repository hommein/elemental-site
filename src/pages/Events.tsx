import { useEffect, useState } from "react";

type Ev = {
  id: number; section: string; img?: string | null; title: string; when_text?: string | null;
  where_text?: string | null; date?: string | null;
  body: string[]; links?: { label: string; url: string }[] | null;
};
type Data = { featured: Ev[]; show: Ev[]; retreat: Ev[]; fave: Ev[] };

const todayPT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

function Tag({ date, dark }: { date?: string | null; dark?: boolean }) {
  if (!date) return null;
  const past = date < todayPT;
  const cls = past
    ? (dark ? "bg-white/10 text-ea-paper/60" : "bg-ea-espresso/10 text-ea-espresso/60")
    : "bg-ea-gold text-ea-espresso";
  return (
    <span className={"inline-block rounded-full px-3 py-0.5 text-[11px] font-semibold uppercase tracking-[0.12em] " + cls}>
      {past ? "Past" : "Upcoming"}
    </span>
  );
}

function EventSplit({ ev, flip }: { ev: Ev; flip: boolean }) {
  return (
    <div className="container grid md:grid-cols-2 gap-10 items-center">
      {ev.img && <img src={ev.img} alt={ev.title} loading="lazy"
        className={"rounded-[10px] w-full max-w-[440px] mx-auto shadow-sm max-md:order-first" + (flip ? " md:order-last" : "")} />}
      <div>
        {ev.date && <div className="mb-2"><Tag date={ev.date} /></div>}
        <h2 className="text-ea-accent mt-0 mb-1">{ev.title}</h2>
        {ev.when_text && <p className="font-semibold m-0">{ev.when_text}</p>}
        {ev.where_text && <p className="m-0 text-ea-espresso/70">{ev.where_text}</p>}
        {ev.body.map((p, i) => <p key={i} className="mt-4">{p}</p>)}
        {ev.links && ev.links.length > 0 && (
          <p className="mt-5 flex flex-wrap gap-3">
            {ev.links.map(l => (
              <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn">{l.label}</a>
            ))}
          </p>
        )}
      </div>
    </div>
  );
}

export default function Events() {
  const [d, setD] = useState<Data | null>(null);
  useEffect(() => {
    fetch("/api/events").then(r => r.json()).then(setD).catch(() => setD({ featured: [], show: [], retreat: [], fave: [] }));
  }, []);

  return (
    <>
      <section className="bg-ea-espresso text-center">
        <div className="container !py-14">
          <h1 className="text-ea-paper mb-2">Featured Events</h1>
          <p className="text-ea-paper/80 max-w-[560px] mx-auto m-0">
            Major events & retreats — past & future! Performances, showcases, and community celebrations.
          </p>
        </div>
      </section>

      {!d && <section><div className="container text-center text-ea-espresso/50">Loading…</div></section>}

      {d?.featured.map((ev, i) => (
        <section key={ev.id} className={i % 2 ? "bg-ea-cream" : ""}>
          <EventSplit ev={ev} flip={i % 2 === 1} />
        </section>
      ))}

      {d && d.show.length > 0 && (
        <section className="bg-ea-espresso">
          <div className="container">
            <h2 className="text-ea-paper text-center mt-0 mb-2">Upcoming Shows</h2>
            <p className="text-ea-paper/80 text-center mb-8">Find our flyers at these upcoming local community events!</p>
            <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
              {d.show.map(sh => (
                <a key={sh.id} href={sh.links?.[0]?.url} target="_blank" rel="noreferrer"
                  className="rounded-[10px] bg-white/5 border border-white/10 p-5 text-ea-paper no-underline hover:bg-white/10 transition-colors">
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-ea-gold font-semibold text-sm">{sh.when_text}</span>
                    <Tag date={sh.date} dark />
                  </div>
                  <div className="text-lg font-semibold mt-1">{sh.title}</div>
                  <p className="text-ea-paper/75 text-sm mt-2 mb-0">{sh.body[0]}</p>
                </a>
              ))}
            </div>
          </div>
        </section>
      )}

      {d && d.retreat.length > 0 && (
        <>
          <section>
            <div className="container !pb-4">
              <h2 className="text-center text-ea-accent mt-0">Past Retreats We Have Enjoyed</h2>
            </div>
          </section>
          {d.retreat.map((ev, i) => (
            <section key={ev.id} className="!pt-0">
              <EventSplit ev={ev} flip={i % 2 === 0} />
            </section>
          ))}
        </>
      )}

      {d && d.fave.length > 0 && (
        <section className="bg-ea-cream">
          <div className="container text-center">
            <h2 className="text-ea-accent mt-0">Our Fave Community Events of the Year</h2>
            <ul className="list-none p-0 m-0 inline-block text-left">
              {d.fave.map(f => (
                <li key={f.id} className="py-1"><span className="font-semibold text-ea-brown w-24 inline-block">{f.when_text}</span>{f.title}</li>
              ))}
            </ul>
          </div>
        </section>
      )}
    </>
  );
}
