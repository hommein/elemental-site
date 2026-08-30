type Ev = {
  img: string; title: string; when?: string; where?: string; date?: string;
  body: string[]; links?: { label: string; url: string }[];
};

const FEATURED: Ev[] = [
  {
    img: "/events/tango.jpg",
    title: "The Stranger & Beethoven’s Tango",
    date: "2026-09-11",
    when: "Friday, September 11th",
    where: "Lobero Theatre",
    body: [
      "Catch a few of our featured aerialists in Meredith Ventura’s newest work, The Stranger. Performed alongside Fernanda Ghi and Alfredo Minetti’s brand-new work Beethoven’s Tango, this evening brings together two works concerned with the artist’s inner world and the forces that shape expression.",
      "Beethoven’s Tango merges dance and live music into a singular theatrical experience.",
      "Together, The Stranger and Beethoven’s Tango ask what it means to create, to be seen, and to remain human in a world that often misunderstands the depths of feeling.",
    ],
    links: [{ label: "Get Tickets", url: "https://selah.dance/" }],
  },
  {
    img: "/events/pride.jpeg",
    title: "Santa Barbara Pride Festival",
    date: "2026-08-22",
    when: "Saturday, Aug 22nd · 12–6pm",
    where: "Chase Palm Park",
    body: [
      "Wrap up the summer sharing what we love and celebrating love! We have been invited back to perform beachside at Pacific Pride Foundation's Pride Festival happening at Chase Palm Park!",
      "An epic day of DJs, live music, drag shows, vendors, playing & dancing right next to the beach, celebrating love in all its many forms! Sign up or just come hang with us — the rig will be up noon to 6pm.",
    ],
    links: [{ label: "Pacific Pride Foundation", url: "https://pacificpridefoundation.org/summer-of-pride/pacific-pride-festival/" }],
  },
  {
    img: "/events/showcase.png",
    title: "In-House Showcase & Jam",
    date: "2026-07-31",
    when: "Friday, July 31st · 6–8pm",
    where: "Elemental Arts Studio",
    body: [
      "Join us for an in-house studio showcase celebrating progress, creativity, and community! Jam out with the EA crew!",
      "6–7pm — Open Hang / Jam Time: bounce ideas with your friends, show a friend a new apparatus, come hang. We will have all sorts of apparatuses up. Newcomers welcome!",
      "7–8pm — In-House Studio Showcase: feeling called to share what you love? Here's a chance to do just that in a relaxed and supportive environment. Share a polished piece, freestyle, or simply cheer others on. Works in progress, silly, or serious — all are welcome in this safe space to test ideas! Your act does NOT need to be aerial: dance, flow, and \"circus other\" welcomed!",
    ],
  },
  {
    img: "/events/bloom.jpg",
    title: "Elemental Bloom — Spring Showcase ft. Pyrokitten Conclave",
    date: "2025-05-29",
    when: "Thursday, May 29th · Doors 7pm, Show 7:30–9pm",
    where: "Buena Onda SB",
    body: [
      "A night of yummy aerial art and epic fire performances! Aerialists from Elemental Arts have been deep in the sauce, creating brand-new solo acts that have been blooming in their hearts, and they can't wait to share with you all. Pyrokitten Fire Conclave will be performing sick group fire acts they have been creating all spring.",
      "This is a donation-based show. Bring a friend and step into the romantic outdoor atmosphere of Buena Onda, where the enchanting Argentine ambiance awaits — food and drinks available from Buena Onda's kitchen all evening long!",
    ],
    links: [
      { label: "Buena Onda SB", url: "https://www.buenaondasb.com/" },
      { label: "@pyrokittenconclave", url: "https://www.instagram.com/pyrokittenconclave/" },
    ],
  },
  {
    img: "/events/wildflowers.jpeg",
    title: "Wildflowers: A Story Told Through Aerial, Circus, and Dance",
    date: "2024-06-01",
    when: "Past Production",
    body: [
      "With a special prequel by Paper Doll Militia & Circus with a Purpose. How do art & movement help us to heal? Seen through the lens of aerial, circus, and dance arts, our artists navigate the body's natural survival responses: fight, flight, freeze and fawn.",
      "In the summertime, we dance through lush fields. But in the dry fall heat, a wildfire engulfs the vibrant landscape, leaving scorched earth in its wake. In the harsh grip of winter, we roam through fields of withering wildflowers, each flower representing our bodies' natural responses to this communal trauma. But why do these emotions seem so negative? Have they come as guides to teach us something about ourselves?",
    ],
    links: [
      { label: "Watch the Full Show on YouTube", url: "https://www.youtube.com/watch?v=Mqpc9g0E7BQ" },
      { label: "Show Photos", url: "https://www.facebook.com/media/set/?set=a.10236981861106212&type=3" },
    ],
  },
];

const SHOWS = [
  { date: "2026-04-25", when: "April 25th, 2026", title: "Santa Barbara Earth Day", text: "Find our aerialists flying high in Alameda Park for Santa Barbara's Earth Day Festival!", url: "https://www.sbearthday.org/" },
  { date: "2026-06-20", when: "June 20th, 2026", title: "Santa Barbara Summer Solstice Festival", text: "Find our flyers performing alongside the music at the mainstage in Alameda Park!", url: "https://www.solsticeparade.com/" },
  { date: "2025-08-23", when: "August 23rd, 2025", title: "Pacific Pride at the Beach Festival", text: "Hang with us at Cabrillo Beach Park 11am–7pm. A free event celebrating the beauty, art, and creativity LGBTQ+ individuals bring to the world.", url: "https://pacificpridefoundation.org/summer-of-pride/pacific-pride-festival/" },
  { date: "2025-10-31", when: "October 2025", title: "Boo at the Zoo", text: "Every night 5–8pm at the Santa Barbara Zoo's \"spell-a-bration\"! Six nights of Halloween spirit, trick-or-treating for kids, tasty treats and boo-zy adult beverages.", url: "https://www.sbzoo.org/boo-at-the-zoo/" },
];

const RETREATS: Ev[] = [
  {
    img: "/events/retreat_nicaragua.jpeg",
    title: "Popoyo, Nicaragua — Aerial, Circus & Yoga Retreat",
    when: "All month long · weekly options available",
    body: [
      "Acro, Aerial, Yoga Impact Retreat with Circus with Purpose. Connect with purpose through yoga and circus. Step into a breathtakingly beautiful setting and co-create with a dynamic family of passionate instructors, artists and fellow retreaters.",
      "Immerse yourself in new moves, ideas, friends and food. Expertly curated to inspire creativity, movement mastery and lifelong, cross-cultural connections in Nicaragua. Donate and build circus community for local schools!",
    ],
    links: [{ label: "circuswithpurpose.art", url: "https://www.circuswithpurpose.art/" }],
  },
  {
    img: "/events/retreat_fire.jpg",
    title: "Fire and Flight Retreat — Twentynine Palms",
    when: "3 days in the desert",
    body: [
      "Join us in the Twentynine Palms desert for 3 days of creative expression through aerial and fire dance. Hosted by Cirque du Soleil artist Amanda Ritchie and award-winning fire dancer Cat LaCohie.",
    ],
    links: [{ label: "Retreat Details", url: "https://www.vixendeville.com/retreat/" }],
  },
];

const FAVES = [
  ["April", "Santa Barbara Earth Day"],
  ["May", "Shabang Music Festival"],
  ["June", "Santa Barbara Summer Solstice Festival"],
  ["August", "Pacific Pride at the Beach Festival"],
  ["October", "Boo at the Zoo"],
];

const todayPT = new Intl.DateTimeFormat("en-CA", { timeZone: "America/Los_Angeles" }).format(new Date());

function Tag({ date, dark }: { date?: string; dark?: boolean }) {
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
      <img src={ev.img} alt={ev.title} loading="lazy"
        className={"rounded-[10px] w-full max-w-[440px] mx-auto shadow-sm max-md:order-first" + (flip ? " md:order-last" : "")} />
      <div>
        {ev.date && <div className="mb-2"><Tag date={ev.date} /></div>}
        <h2 className="text-ea-accent mt-0 mb-1">{ev.title}</h2>
        {ev.when && <p className="font-semibold m-0">{ev.when}</p>}
        {ev.where && <p className="m-0 text-ea-espresso/70">{ev.where}</p>}
        {ev.body.map((p, i) => <p key={i} className="mt-4">{p}</p>)}
        {ev.links && (
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

      {FEATURED.map((ev, i) => (
        <section key={ev.title} className={i % 2 ? "bg-ea-cream" : ""}>
          <EventSplit ev={ev} flip={i % 2 === 1} />
        </section>
      ))}

      <section className="bg-ea-espresso">
        <div className="container">
          <h2 className="text-ea-paper text-center mt-0 mb-2">Upcoming Shows</h2>
          <p className="text-ea-paper/80 text-center mb-8">Find our flyers at these upcoming local community events!</p>
          <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
            {SHOWS.map(s => (
              <a key={s.title} href={s.url} target="_blank" rel="noreferrer"
                className="rounded-[10px] bg-white/5 border border-white/10 p-5 text-ea-paper no-underline hover:bg-white/10 transition-colors">
                <div className="flex items-center justify-between gap-2">
                  <span className="text-ea-gold font-semibold text-sm">{s.when}</span>
                  <Tag date={s.date} dark />
                </div>
                <div className="text-lg font-semibold mt-1">{s.title}</div>
                <p className="text-ea-paper/75 text-sm mt-2 mb-0">{s.text}</p>
              </a>
            ))}
          </div>
        </div>
      </section>

      <section>
        <div className="container !pb-4">
          <h2 className="text-center text-ea-accent mt-0">Past Retreats We Have Enjoyed</h2>
        </div>
      </section>
      {RETREATS.map((ev, i) => (
        <section key={ev.title} className={"!pt-0 " + (i % 2 ? "" : "")}>
          <EventSplit ev={ev} flip={i % 2 === 0} />
        </section>
      ))}

      <section className="bg-ea-cream">
        <div className="container text-center">
          <h2 className="text-ea-accent mt-0">Our Fave Community Events of the Year</h2>
          <ul className="list-none p-0 m-0 inline-block text-left">
            {FAVES.map(([m, t]) => (
              <li key={t} className="py-1"><span className="font-semibold text-ea-brown w-24 inline-block">{m}</span>{t}</li>
            ))}
          </ul>
        </div>
      </section>
    </>
  );
}
