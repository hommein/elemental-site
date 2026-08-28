export default function Home() {
  return (
    <>
      <section
        className="flex flex-col items-center justify-center text-center text-ea-paper px-4 py-12 aspect-[2000/850] bg-cover bg-no-repeat [background-position:28%_50%]"
        style={{ backgroundImage: "linear-gradient(rgba(21,21,21,0.4), rgba(75,61,52,0.5)), url(/hero.jpg)" }}
      >
        <h1 className="text-ea-paper">Aerial Arts · Dance · Flow</h1>
        <p className="max-w-[580px] mt-4 mb-8">
          An all-inclusive training space in Santa Barbara, CA — an aerial &amp; dance
          practice for the Santa Barbara community. Open studio time available &amp; encouraged.
        </p>
        <a className="btn btn--accent" href="/classes">Find Your Flight</a>
      </section>

      <section className="container">
        <h2 className="mb-8">Weekly Group Classes &amp; Jams</h2>
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(230px,1fr))]">
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/aerial.jpg" alt="Aerial silks" loading="lazy" className="w-full h-[190px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Aerial Arts</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Silks, Lyra, Hammock, Straps &amp; more — all levels welcome.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/acro.jpg" alt="Acrobatics and flexibility" loading="lazy" className="w-full h-[190px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Acrobatics &amp; Flexibility</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Handstands, Intro to Contortion, Strength &amp; Flexibility training.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/dance.jpg" alt="Dance class" loading="lazy" className="w-full h-[190px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Dance</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Ballet, Jazz, Belly Dancing, Contemporary, Heels, House &amp; more.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/fire.jpg" alt="Fire and flow arts" loading="lazy" className="w-full h-[190px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Fire &amp; Flow Arts</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Hoops, Fans, Rope Dart, Poi, Staff — cross-prop technique &amp; flow theory.</p>
          </div>
        </div>
      </section>

      <section className="bg-ea-cream">
        <div className="container grid md:grid-cols-2 gap-10 items-center">
          <img src="/photos/sunset.jpg" alt="Sunset aerial performance" loading="lazy" className="rounded-[10px] w-full" />
          <div>
            <h2 className="mt-0 mb-4">Dance With Us!</h2>
            <p className="mb-4">Aerial is a dance form, a workout, an avenue for self-expression &amp;
              self-discovery! Play, explore, challenge yourself and grow.</p>
            <p className="mb-4">Elemental is a group of supportive friends and we can&apos;t wait to fly with you.
              Group lessons on various apparatuses throughout the week — or book semi-private
              &amp; private lessons around <em>your</em> schedule. Lessons catered to all skill levels.</p>
            <p className="mb-6">Elemental Arts is a shared space with Selah Dance and others.</p>
            <a className="btn" href="/contact">Contact Us With Any Questions</a>
          </div>
        </div>
      </section>

      <section className="container grid md:grid-cols-2 gap-10 items-center">
        <div>
          <h2 className="mt-0 mb-4">Open Gym</h2>
          <p className="mb-6">Have your own apparatus or a self-led practice? Open studio training time is
            available &amp; encouraged for members and regular students.</p>
          <a className="btn" href="/classes">See Times &amp; How to Book</a>
        </div>
        <img src="/photos/studio.jpg" alt="The Elemental Arts studio" loading="lazy" className="rounded-[10px] w-full max-md:order-first" />
      </section>

      <section className="bg-ea-espresso text-center">
        <div className="container !py-10">
          <h2 className="text-ea-accent mt-0">Stay in the Know</h2>
          <p className="max-w-[520px] mx-auto mt-2 mb-6 text-ea-paper">
            Sign up for our weekly email list to stay up to date with aerial and dance offerings,
            events, and studio news.
          </p>
          <a className="btn btn--accent" href="/contact">Join the Email List</a>
        </div>
      </section>
    </>
  );
}
