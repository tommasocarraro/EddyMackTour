import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

export default async function AboutPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} />
      <div className="main">
        <section className="about">
          <div className="about-portrait">
            <img src="/about/portrait.jpg" alt="Edoardo, Eddy Mack Tour" />
          </div>
          <div className="about-copy">
            <h2>About</h2>
            <p>
              Edoardo, aka Eddy Mack Tour, is an Italian filmmaker and director who works
              mainly with music videos, fashion films, documentaries, events, art and
              architecture.
            </p>
          </div>
        </section>
      </div>
    </>
  );
}
