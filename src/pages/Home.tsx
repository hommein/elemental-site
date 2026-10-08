import ContactForm from "../components/ContactForm";

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

      <section className="bg-ea-cream">
        <div className="container !py-16 md:!py-20 grid md:grid-cols-2 gap-10 items-center">
          <img src="/dancewithus.jpg" alt="Aerialist posing on sling" loading="lazy" className="rounded-[10px] w-full max-w-[560px] max-h-[640px] object-cover mx-auto" />
          <div>
            <h2 className="mt-0 mb-2">An aerial &amp; dance practice for the Santa Barbara community</h2>
            <p className="text-xl mb-4">Find Your Flight</p>
            <p className="font-semibold mb-4">Weekly Group Classes &amp; Jams:</p>
            <p className="mb-4"><strong>Aerial Arts</strong><br />Silk, Lyra, Hammock, Straps &amp; More</p>
            <p className="mb-4"><strong>Acrobatics</strong><br />Flexibility, Handstands, Fire &amp; Flow Arts</p>
            <p className="mb-4"><strong>Dance Classes</strong><br />Ballet, Jazz, Belly, House &amp; More</p>
            <p className="mb-6">Group Classes &amp; Private Lessons<br />Open Gym Training</p>
            <a className="btn" href="/classes">More info On Our Classes - Here</a>
          </div>
        </div>
      </section>

      <section className="container">
        <h2 className="mb-8">Weekly Group Classes &amp; Jams</h2>
        <div className="grid gap-6 grid-cols-2 md:grid-cols-4">
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/aerial.jpg" alt="Aerial silks" loading="lazy" className="w-full aspect-[3/4] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Aerial Arts</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Silks, Lyra, Hammock, Straps &amp; more — all levels welcome.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/acro.jpg" alt="Acrobatics and flexibility" loading="lazy" className="w-full aspect-[3/4] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Acrobatics &amp; Flexibility</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Handstands, Intro to Contortion, Strength &amp; Flexibility training.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/dance.jpg" alt="Dance class" loading="lazy" className="w-full aspect-[3/4] object-cover scale-125 [object-position:65%_50%]" />
            <h3 className="text-xl mt-4 mb-1 px-6">Dance</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Ballet, Jazz, Belly Dancing, Contemporary, Heels, House &amp; more.</p>
          </div>
          <div className="rounded-[10px] overflow-hidden bg-white shadow-sm text-center pb-5">
            <img src="/photos/fire.jpg" alt="Fire and flow arts" loading="lazy" className="w-full aspect-[3/4] object-cover" />
            <h3 className="text-xl mt-4 mb-1 px-6">Fire &amp; Flow Arts</h3><p className="px-6 m-0 text-sm text-ea-espresso/80">Hoops, Fans, Rope Dart, Poi, Staff — cross-prop technique &amp; flow theory.</p>
          </div>
        </div>
      </section>


      <section className="container grid md:grid-cols-2 gap-10 items-stretch" id="contact">
        <div>
          <h2 className="mt-0 mb-3">Contact the Studio</h2>
          <p className="mb-5">Questions about classes, private lessons, or open studio time? Send us a note — we&apos;d love to hear from you.</p>
          <ContactForm />
        </div>
        <img src="/photos/studio.jpg" alt="The Elemental Arts studio" loading="lazy" className="rounded-[10px] w-full h-full object-cover max-md:h-[300px]" />
        <div className="md:col-span-2 rounded-[10px] bg-ea-cream p-5 text-sm leading-relaxed grid sm:grid-cols-3 gap-2 text-center">
          <p className="m-0"><a href="https://maps.google.com/?q=22+W+Mission+St+Unit+B,+Santa+Barbara,+CA+93101">22 W Mission St Unit B, Santa Barbara, CA 93101</a></p>
          <p className="m-0"><a href="mailto:elementalaerialarts@gmail.com">elementalaerialarts@gmail.com</a></p>
          <p className="m-0"><a href="tel:+18053642037">(805) 364-2037</a> (call or text)</p>
        </div>
      </section>

      <section className="bg-ea-espresso text-center">
        <div className="container !py-10">
          <h2 className="text-ea-accent mt-0">Stay in the Know</h2>
          <p className="max-w-[520px] mx-auto mt-2 mb-6 text-ea-paper">
            Sign up for our weekly email list to stay up to date with aerial and dance offerings,
            events, and studio news.
          </p>
          <a className="btn btn--accent" href="/#contact">Join the Email List</a>
        </div>
      </section>
    </>
  );
}
