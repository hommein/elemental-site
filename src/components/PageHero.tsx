import type { ReactNode } from "react";

export default function PageHero({ title, children }: { title: string; children?: ReactNode }) {
  return (
    <section className="bg-ea-espresso text-center">
      <div className="container !py-10">
        <h1 className="text-ea-paper mb-2">{title}</h1>
        <p className="text-ea-paper/80 max-w-[560px] mx-auto m-0">{children}</p>
      </div>
    </section>
  );
}
