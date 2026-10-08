export default function Home() {
  return (
    <>
      <section
        className="flex flex-col items-center justify-center text-center text-ea-paper px-4 py-12 aspect-[2000/850] max-md:aspect-auto max-md:min-h-[430px] max-md:py-16 bg-cover bg-no-repeat [background-position:28%_50%]"
        style={{ backgroundImage: "linear-gradient(rgba(21,21,21,0.4), rgba(75,61,52,0.5)), url(/hero.jpg)" }}
      >
        <h1 className="text-ea-paper">Aerial Arts<br />Dance Classes</h1>
        <p className="max-w-[580px] mt-4 mb-0">
          Flexibility, Acrobatics &amp; Flow Arts Instruction<br />
          An all-inclusive training space in Santa Barbara, CA.
        </p>
        <p className="max-w-[580px] mt-4 mb-8">Open studio time available &amp; encouraged.</p>
        <a className="btn btn--accent" href="/classes">SIGN UP FOR CLASS - HERE</a>
      </section>

      <section className="container text-center">
        <h2 className="mb-2">An aerial &amp; dance practice for the Santa Barbara community</h2>
        <p className="text-xl mb-8">Find Your Flight</p>
        <h3 className="text-2xl mb-6">Weekly Group Classes &amp; Jams:</h3>
        <div className="grid gap-6 grid-cols-[repeat(auto-fit,minmax(230px,1fr))] text-left">
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/aerial.jpg" alt="Aerial silks" loading="lazy" className="w-full h-[340px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Aerial Arts</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Silk, Lyra, Hammock, Straps &amp; More</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/acro.jpg" alt="Acrobatics" loading="lazy" className="w-full h-[340px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Acrobatics</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Flexibility, Handstands, Fire &amp; Flow Arts</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/dance.jpg" alt="Dance class" loading="lazy" className="w-full h-[340px] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Dance Classes</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Ballet, Jazz, Belly, House &amp; More</p>
          </div>
        </div>
        <p className="mt-10 mb-1 text-lg">Group Classes &amp; Private Lessons</p>
        <p className="mt-0 mb-6 text-lg">Open Gym Training</p>
        <a className="btn" href="/classes">More info On Our Classes - Here</a>
      </section>

      <section className="bg-ea-cream">
        <div className="container !py-16 md:!py-20 grid md:grid-cols-2 gap-10 items-center">
          <img src="/dancewithus.jpg" alt="Aerialist posing on sling" loading="lazy" className="rounded-[10px] w-full max-w-[560px] max-h-[640px] object-cover mx-auto" />
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
