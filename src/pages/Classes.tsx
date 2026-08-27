export default function Classes() {
  return (
    <section className="container">
      <h1>Classes &amp; Schedule</h1>
      <p>Weekly offerings through Elemental Arts — aerial for all levels, fire &amp; flow arts,
        flexibility &amp; handstands, dance in a range of styles, and open gym.</p>
      {/* TODO: replace Google Calendar iframe with data-driven schedule */}
      <div className="calendar-wrap">
        <iframe
          title="Class Calendar"
          src="https://calendar.google.com/calendar/embed?src=elementalaerialarts%40gmail.com&ctz=America%2FLos_Angeles&mode=WEEK"
          style={{ border: 0, width: "100%", height: 600 }}
        />
      </div>
      <h2>Ready for your first class?</h2>
      <p>Download and e-sign the waiver before your first class. {/* TODO: online waiver flow */}</p>
      <a className="btn" href="/contact">New students — contact us</a>
    </section>
  );
}
