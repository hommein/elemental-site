export default function Home() {
  return (
    <>
      <section className="hero" style={{
        background: "linear-gradient(rgba(21,21,21,0.45), rgba(75,61,52,0.55)), url(/hero.png) center/cover",
        color: "var(--ea-paper)", textAlign: "center", padding: "7rem 1rem",
      }}>
        <h1 style={{ color: "var(--ea-paper)" }}>Aerial Arts · Dance · Flow</h1>
        <p style={{ maxWidth: 560, margin: "1rem auto 2rem" }}>
          An all-inclusive training space in Santa Barbara, CA. Silks, lyra, hammock,
          straps, acrobatics, flexibility, fire &amp; flow arts, and dance for every level.
        </p>
        <a className="btn btn--accent" href="/classes">Find Your Flight</a>
      </section>

      <section className="container">
        <h2>Weekly Group Classes &amp; Jams</h2>
        <div className="cards">
          <div className="card"><h3>Aerial Arts</h3><p>Silks, Lyra, Hammock, Straps &amp; more — all levels welcome.</p></div>
          <div className="card"><h3>Acrobatics &amp; Flexibility</h3><p>Handstands, intro to contortion, strength &amp; flexibility training.</p></div>
          <div className="card"><h3>Dance</h3><p>Ballet, Jazz, Belly, Contemporary, Heels, House &amp; more.</p></div>
          <div className="card"><h3>Fire &amp; Flow Arts</h3><p>Hoops, fans, rope dart, poi, staff — cross-prop technique and flow theory.</p></div>
        </div>
        <p style={{ marginTop: "2rem" }}>
          Group classes, private lessons, and open gym — <a href="/contact">contact us</a> to find the fit for you.
        </p>
      </section>
    </>
  );
}
