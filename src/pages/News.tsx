import { useEffect, useState } from "react";

type Post = { id: number; title: string; date: string; img?: string | null; body: string[]; links?: { label: string; url: string }[] | null };

export default function News() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  const [open, setOpen] = useState<Post | null>(null);
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => { if (e.key === "Escape") setOpen(null); };
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => { window.removeEventListener("keydown", onKey); document.body.style.overflow = ""; };
  }, [open]);
  useEffect(() => {
    fetch("/api/news").then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => setPosts([]));
  }, []);

  return (
    <>
      <section className="bg-ea-espresso text-center">
        <div className="container !py-10">
          <h1 className="text-ea-paper mb-2">Studio News</h1>
          <p className="text-ea-paper/80 max-w-[560px] mx-auto m-0">
            Casual updates from the studio — schedule changes, new classes, and what we've been up to.
          </p>
        </div>
      </section>

      <section className="container !py-8">
        {posts === null && <p className="text-ea-espresso/50">Loading…</p>}
        {posts && posts.length === 0 && <p className="text-ea-espresso/50 text-center">No updates yet — check back soon!</p>}
        {posts && posts.length > 0 && (
          <div className="grid gap-x-6 gap-y-8 sm:grid-cols-2 lg:grid-cols-3">
            {posts.map(p => (
              <article key={p.id} className="flex flex-col">
                {p.img && (
                  <button type="button" onClick={() => setOpen(p)} className="block p-0 border-0 bg-transparent cursor-zoom-in w-full" aria-label={"View image: " + p.title}>
                    <img src={p.img} alt={p.title} loading="lazy" className="rounded-[10px] w-full aspect-[4/5] object-cover shadow-sm" />
                  </button>
                )}
                <h3 className="text-lg leading-snug mt-3 mb-1">{p.title}</h3>
                {p.body.map((para, j) => <p key={j} className="m-0 mt-1 text-[0.95rem] leading-snug text-ea-espresso/85">{para}</p>)}
                {p.links && p.links.length > 0 && (
                  <p className="mt-3 mb-0 flex flex-wrap gap-2">
                    {p.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn !px-4 !py-1.5 text-sm">{l.label}</a>)}
                  </p>
                )}
              </article>
            ))}
          </div>
        )}
      </section>

      {open && open.img && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 cursor-zoom-out" onClick={() => setOpen(null)} role="dialog" aria-modal="true" aria-label={open.title}>
          <button type="button" onClick={() => setOpen(null)} aria-label="Close"
            className="absolute top-3 right-4 text-white/90 hover:text-white text-4xl leading-none bg-transparent border-0 cursor-pointer">&times;</button>
          <img src={open.img} alt={open.title} onClick={e => e.stopPropagation()}
            className="max-w-full max-h-[92vh] rounded-[10px] shadow-xl cursor-default" />
        </div>
      )}
    </>
  );
}
