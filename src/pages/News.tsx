import { useEffect, useState } from "react";

type Post = { id: number; title: string; date: string; img?: string | null; body: string[]; links?: { label: string; url: string }[] | null };

export default function News() {
  const [posts, setPosts] = useState<Post[] | null>(null);
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
                  <a href={p.img} target="_blank" rel="noreferrer" className="block">
                    <img src={p.img} alt={p.title} loading="lazy" className="rounded-[10px] w-full aspect-[4/5] object-cover shadow-sm" />
                  </a>
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
    </>
  );
}
