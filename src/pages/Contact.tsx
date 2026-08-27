export default function Contact() {
  return (
    <section className="container">
      <h1>Contact Us</h1>
      <p>We hope to see you soon!</p>
      {/* TODO: working form via Cloudflare Worker + email */}
      <ul>
        <li>22 W Mission St Unit B, Santa Barbara, CA</li>
        <li><a href="mailto:ElementalAerialArts@gmail.com">ElementalAerialArts@gmail.com</a></li>
        <li><a href="tel:+18053642037">(805) 364-2037</a></li>
        <li><a href="https://www.instagram.com/elemental_aerial_arts/">@elemental_aerial_arts</a></li>
      </ul>
    </section>
  );
}
