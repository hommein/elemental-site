import ContactForm from "../components/ContactForm";

export default function Contact() {
  return (
    <section className="container grid md:grid-cols-2 gap-10 items-start">
      <div>
        <h1 className="mt-0">Contact Us</h1>
        <p>We hope to see you soon!</p>
        <ContactForm />
      </div>
      <div className="rounded-[10px] bg-ea-cream p-5 text-sm leading-relaxed">
        <p className="m-0 font-semibold">Elemental Aerial Arts</p>
        <p className="m-0"><a href="https://maps.google.com/?q=22+W+Mission+St+Unit+B,+Santa+Barbara,+CA+93101">22 W Mission St Unit B, Santa Barbara, CA 93101</a></p>
        <p className="m-0"><a href="mailto:elementalaerialarts@gmail.com">elementalaerialarts@gmail.com</a></p>
        <p className="m-0"><a href="tel:+18053642037">(805) 364-2037</a> (call or text)</p>
        <p className="m-0"><a href="https://www.instagram.com/elemental_aerial_arts/">@elemental_aerial_arts</a></p>
      </div>
    </section>
  );
}
