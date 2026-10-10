import ContactForm from "../components/ContactForm";

const WA_COMMUNITY = "https://chat.whatsapp.com/L4YD2HVKwH69xxIfVtVFG6";
const WA_VIRTUAL = "https://chat.whatsapp.com/JsCfF7QravEI0w17N10haa";

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
      <div className="md:col-span-2 rounded-[10px] bg-ea-cream p-6 text-center">
        <h2 className="mt-0 mb-2">Stay Connected on Whatsapp</h2>
        <p className="mt-0 font-semibold">Join the EA Whatsapp Community</p>
        <p>💛 Sub-groups for Open Training, Photoshoots, Community Events, Virtual Lessons, and Nerdy Aerial Chatting</p>
        <p>Join the chats that interest you &amp; invite others</p>
        <p>✨ Virtual Lessons are also an option! Join the <a href={WA_VIRTUAL} target="_blank" rel="noreferrer">Virtual Fam Whatsapp group</a></p>
        <p className="italic">*Virtual &amp; Hybrid Class Times*</p>
        <p className="mb-0"><a className="btn" href={WA_COMMUNITY} target="_blank" rel="noreferrer">Join the Whatsapp Community</a></p>
      </div>
    </section>
  );
}
