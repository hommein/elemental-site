import { useState } from "react";
import Lightbox from "../components/Lightbox";
import PageHero from "../components/PageHero";

const SHOP = "https://selah.dance/shop";
const IMGS = [1, 2, 3, 4, 5, 6].map(n => `/merch/${n}.jpg`);

export default function Merch() {
  const [open, setOpen] = useState<string | null>(null);
  return (
    <>
      <PageHero title="Merch">
        Elemental Arts Merch Is Here 🤩 Shop to Support Our New Studio 💞 Fundraiser by Selah Dance 💞
      </PageHero>

      <section className="container !py-8">
        <p className="text-center mt-0 mb-6">
          <a className="btn" href={SHOP} target="_blank" rel="noreferrer">Shop the fundraiser</a>
        </p>
        <div className="grid gap-5 grid-cols-2 lg:grid-cols-3">
          {IMGS.map((src, i) => (
            <button key={src} type="button" onClick={() => setOpen(src)} aria-label={`Merch photo ${i + 1}`}
              className="block p-0 border-0 bg-transparent cursor-zoom-in w-full">
              <img src={src} alt={`Elemental merch ${i + 1}`} loading="lazy" className="rounded-[10px] w-full aspect-[4/5] object-cover shadow-sm" />
            </button>
          ))}
        </div>
        <p className="text-center mt-8 mb-0">
          <a className="btn" href={SHOP} target="_blank" rel="noreferrer">Shop the fundraiser</a>
        </p>
      </section>

      <Lightbox src={open} alt="Elemental merch" onClose={() => setOpen(null)} />
    </>
  );
}
