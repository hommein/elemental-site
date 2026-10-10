import { Link } from "react-router-dom";
import PageHero from "../components/PageHero";

const EMAIL = "elementalaerialarts@gmail.com";
const GCAL = "https://calendar.google.com/calendar/embed?src=elementalaerialarts%40gmail.com&ctz=America%2FLos_Angeles";
const Mail = () => <a href={`mailto:${EMAIL}`}>{EMAIL}</a>;

function Q({ q, children }: { q: string; children: React.ReactNode }) {
  return (
    <div className="py-6 border-t border-ea-espresso/10 first:border-t-0 first:pt-0">
      <h2 className="text-xl mt-0 mb-2">{q}</h2>
      <div className="leading-relaxed [&>p]:m-0 [&>p+p]:mt-2 [&>ul]:my-2 [&>ul]:pl-5 [&>ul]:list-disc [&_li]:mt-1">{children}</div>
    </div>
  );
}

export default function OpenGym() {
  return (
    <>
      <PageHero title="Open Gym">
        Open Gym is available for students who regularly attend EA classes or aerialists who hold monthly memberships.
      </PageHero>

      <section className="container !py-8 max-w-[760px]">
        <p className="text-center mt-0 mb-8">
          <Link className="btn" to="/classes">Book Open Gym</Link>
        </p>

        <Q q="How do I reserve open time at EA?">
          <ul>
            <li>Pick a day and time on the <Link to="/classes">Classes</Link> page and use the "Book Open Gym" button. Up to 6 aerialists can share a block.</li>
            <li>If a class is running in the main room, you are limited to the Front Studio Lounge points. If no class is running in the main room, you are welcome to any point.</li>
            <li>EA is a shared space with Selah Dance and other awesome auxiliary dance groups! Cross check studio availability on our <a href={GCAL} target="_blank" rel="noreferrer">Google Calendar</a>.</li>
            <li>Bring your own apparatus. If you need to borrow an apparatus, contact us at <Mail />.</li>
          </ul>
        </Q>

        <Q q="Pricing">
          <p><strong>$15/hour</strong> for Drop In</p>
          <p><strong>$110/unlimited</strong> for Monthly Members</p>
        </Q>

        <Q q="How do I become a monthly member?">
          <p>Email us at <Mail />. We will be in contact right away and confirm your membership.</p>
        </Q>

        <Q q="What is needed to qualify for open gym?">
          <p>Aerialists must get approval from EA management. This may include demonstration of proper rigging and safety techniques. Aerialists will be approved for open training on a case by case basis. Aerialists must complete an in person walk through with an approved EA Staff Member.</p>
          <p>*You MUST have a waiver on file. But you need that for class anyhow ;)</p>
        </Q>

        <Q q="What if I am visiting from out of town and not a regular EA student?">
          <p>Aerialists may be approved on a case by case basis. Contact us at <Mail />! We want to see you training ;)</p>
        </Q>

        <Q q="What if I want to reserve the main room or front studio lounge for my group/rehearsal/etc?">
          <p>We offer rentals for dance troupes, rehearsals, theater groups, private events, and more! Contact us at <Mail /> for more info!</p>
        </Q>
      </section>
    </>
  );
}
