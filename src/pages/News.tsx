import { useEffect, useState } from "react";

type Post = { id: number; title: string; date: string; img?: string | null; body: string[]; links?: { label: string; url: string }[] | null };

const fmtDate = (d: string) => {
  const [y, m, day] = d.split("-").map(Number);
  return new Date(y, m - 1, day).toLocaleDateString("en-US", { weekday: "long", month: "long", day: "numeric", year: "numeric" });
};

export default function News() {
  const [posts, setPosts] = useState<Post[] | null>(null);
  useEffect(() => {
    fetch("/api/news").then(r => r.json()).then(d => setPosts(d.posts || [])).catch(() => setPosts([]));
  }, []);

  return (
    <>
      <section className="bg-ea-espresso text-center">
        <div className="container !py-14">
          <h1 className="text-ea-paper mb-2">Studio News</h1>
          <p className="text-ea-paper/80 max-w-[560px] mx-auto m-0">
            Casual updates from the studio — schedule changes, new classes, and what we've been up to.
          </p>
        </div>
      </section>

      <section className="container max-w-[760px]">
        {posts === null && <p className="text-ea-espresso/50">Loading…</p>}
        {posts && posts.length === 0 && <p className="text-ea-espresso/50 text-center">No updates yet — check back soon!</p>}
        {posts && posts.map((p, i) => (
          <article key={p.id} className={"py-10" + (i > 0 ? " border-t border-ea-espresso/10" : "")}>
            <p className="m-0 text-xs font-semibold uppercase tracking-[0.12em] text-ea-accent">{fmtDate(p.date)}</p>
            <h2 className="mt-1 mb-4">{p.title}</h2>
            {p.img && <img src={p.img} alt={p.title} loading="lazy" className="rounded-[10px] w-full shadow-sm mb-5" />}
            {p.body.map((para, j) => <p key={j} className="mt-3 leading-relaxed">{para}</p>)}
            {p.links && p.links.length > 0 && (
              <p className="mt-5 flex flex-wrap gap-3">
                {p.links.map(l => <a key={l.url} href={l.url} target="_blank" rel="noreferrer" className="btn">{l.label}</a>)}
              </p>
            )}
          </article>
        ))}
      </section>
    </>
  );
}
