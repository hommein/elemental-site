export default function Home() {
  return (
    <>
      <section className="hero" style={{
        background: "linear-gradient(rgba(21,21,21,0.4), rgba(75,61,52,0.5)), url(/hero.png) center/cover no-repeat",
        color: "var(--ea-paper)", textAlign: "center",
        aspectRatio: "2560 / 1708", display: "flex", flexDirection: "column",
        justifyContent: "center", alignItems: "center", padding: "3rem 1rem",
      }}>
        <h1 style={{ color: "var(--ea-paper)" }}>Aerial Arts · Dance · Flow</h1>
        <p style={{ maxWidth: 580, margin: "1rem auto 2rem" }}>
          An all-inclusive training space in Santa Barbara, CA — an aerial &amp; dance
          practice for the Santa Barbara community. Open studio time available &amp; encouraged.
        </p>
        <a className="btn btn--accent" href="/classes">Find Your Flight</a>
      </section>

      <section className="container">
        <h2>Weekly Group Classes &amp; Jams</h2>
        <div className="cards">
          <div className="card card--photo">
            <img src="/photos/aerial.jpg" alt="Aerial silks" loading="lazy" />
            <h3>Aerial Arts</h3><p>Silks, Lyra, Hammock, Straps &amp; more — all levels welcome.</p>
          </div>
          <div className="card card--photo">
            <img src="/photos/acro.jpg" alt="Acrobatics and flexibility" loading="lazy" />
            <h3>Acrobatics &amp; Flexibility</h3><p>Handstands, Intro to Contortion, Strength &amp; Flexibility training.</p>
          </div>
          <div className="card card--photo">
            <img src="/photos/dance.jpg" alt="Dance class" loading="lazy" />
            <h3>Dance</h3><p>Ballet, Jazz, Belly Dancing, Contemporary, Heels, House &amp; more.</p>
          </div>
          <div className="card card--photo">
            <img src="/photos/fire.jpg" alt="Fire and flow arts" loading="lazy" />
            <h3>Fire &amp; Flow Arts</h3><p>Hoops, Fans, Rope Dart, Poi, Staff — cross-prop technique &amp; flow theory.</p>
          </div>
        </div>
      </section>

      <section style={{ background: "var(--ea-cream)" }}>
        <div className="container split">
          <img src="/photos/sunset.jpg" alt="Sunset aerial performance" loading="lazy" />
          <div>
            <h2>Dance With Us!</h2>
            <p>Aerial is a dance form, a workout, an avenue for self-expression &amp;
              self-discovery! Play, explore, challenge yourself and grow.</p>
            <p>Elemental is a group of supportive friends and we can&apos;t wait to fly with you.
              Group lessons on various apparatuses throughout the week — or book semi-private
              &amp; private lessons around <em>your</em> schedule. Lessons catered to all skill levels.</p>
            <p>Elemental Arts is a shared space with Selah Dance and others.</p>
            <a className="btn" href="/contact">Contact Us With Any Questions</a>
          </div>
        </div>
      </section>

      <section className="container split split--rev">
        <div>
          <h2>Open Gym</h2>
          <p>Have your own apparatus or a self-led practice? Open studio training time is
            available &amp; encouraged for members and regular students.</p>
          <a className="btn" href="/classes">See Times &amp; How to Book</a>
        </div>
        <img src="/photos/studio.jpg" alt="The Elemental Arts studio" loading="lazy" />
      </section>

      <section style={{ background: "var(--ea-brown-deep)", color: "var(--ea-paper)", textAlign: "center" }}>
        <div className="container">
          <h2 style={{ color: "var(--ea-accent)" }}>Stay in the Know</h2>
          <p style={{ maxWidth: 520, margin: "0.5rem auto 1.5rem" }}>
            Sign up for our weekly email list to stay up to date with aerial and dance offerings,
            events, and studio news.
          </p>
          <a className="btn btn--accent" href="/contact">Join the Email List</a>
        </div>
      </section>
    </>
  );
}
