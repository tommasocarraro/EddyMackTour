import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

const COLLABORATORS = [
  { name: "Dior", logo: "/logos/collab/dior.svg" },
  { name: "Disney", logo: "/logos/collab/disney.svg" },
  { name: "Vogue", logo: "/logos/collab/vogue.svg" },
  { name: "Sony Music", logo: "/logos/collab/sony-music.png" },
  { name: "Montblanc", logo: "/logos/collab/montblanc.svg" },
  { name: "Vanity Fair", logo: "/logos/collab/vanity-fair.svg" },
];

export default async function AboutPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} />
      <div className="main">
        <section className="about">
          <div className="about-portrait">
            <img src="/about/portrait.png" alt="Edoardo, Eddy Mack Tour" />
          </div>
          <div className="about-copy">
            <h2>About</h2>
            <p>
              Edoardo, aka Eddy Mack Tour, is an Italian filmmaker and director who works
              mainly with music videos, fashion films, documentaries, events, art and
              architecture.
            </p>
            <p className="about-contact">
              Got a story worth telling? Let&apos;s talk —{" "}
              <a href="mailto:edocarraro1998@gmail.com">edocarraro1998@gmail.com</a>.
            </p>
          </div>
        </section>
        <section className="collab-strip">
          <h3>Selected collaborations</h3>
          <ul>
            {COLLABORATORS.map((c) => (
              <li key={c.name}>
                <img src={c.logo} alt={c.name} />
              </li>
            ))}
          </ul>
        </section>
      </div>
    </>
  );
}
