import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

export const dynamic = "force-dynamic";

// "Selected collaborations" strip. To add a logo: drop the file in
// public/logos/collab/ (SVG or transparent PNG, any colour — CSS renders every
// logo white) and add a line below; the list order is the display order. Tall or
// stacked logos read poorly at the strip's ~28px height, so prefer a horizontal version.
const COLLABORATORS = [
  { name: "Dior", logo: "/logos/collab/dior.svg" },
  { name: "Vogue", logo: "/logos/collab/vogue.svg" },
  { name: "Vanity Fair", logo: "/logos/collab/vanity-fair.svg" },
  { name: "GQ", logo: "/logos/collab/gq.svg" },
  { name: "WIRED", logo: "/logos/collab/wired.svg" },
  { name: "Disney", logo: "/logos/collab/disney.svg" },
  { name: "Disney+", logo: "/logos/collab/disney-plus.svg" },
  { name: "Sony Music", logo: "/logos/collab/sony-music.png" },
  { name: "Warner Music Group", logo: "/logos/collab/warner-music.svg" },
  { name: "Tiffany & Co.", logo: "/logos/collab/tiffany.svg" },
  { name: "Chopard", logo: "/logos/collab/chopard.svg" },
  { name: "Montblanc", logo: "/logos/collab/montblanc.svg" },
  { name: "Golden Goose", logo: "/logos/collab/golden-goose.svg" },
  { name: "Levi's", logo: "/logos/collab/levis.svg" },
  { name: "Barbour", logo: "/logos/collab/barbour.svg" },
  { name: "Herno", logo: "/logos/collab/herno.png" },
  { name: "Fiat", logo: "/logos/collab/fiat.svg" },
  { name: "Visa", logo: "/logos/collab/visa.svg" },
  { name: "Intesa Sanpaolo", logo: "/logos/collab/intesa-sanpaolo.svg" },
  { name: "Banca Ifis", logo: "/logos/collab/banca-ifis.svg" },
  { name: "Pantene", logo: "/logos/collab/pantene.svg" },
  { name: "Head & Shoulders", logo: "/logos/collab/head-shoulders.svg" },
  { name: "Sanlorenzo", logo: "/logos/collab/sanlorenzo.png" },
  { name: "OTB Foundation", logo: "/logos/collab/otb-foundation.png" },
  { name: "Brave Kid", logo: "/logos/collab/brave-kid.png" },
  { name: "Fondazione Querini Stampalia", logo: "/logos/collab/querini-stampalia.svg" },
  { name: "Sherwood Festival", logo: "/logos/collab/sherwood.png" },
  { name: "Hall Padova", logo: "/logos/collab/hall-padova.png" },
  { name: "Furla", logo: "/logos/collab/furla.png" },
  { name: "Liu Jo", logo: "/logos/collab/liu-jo.png" },
  { name: "Arrital", logo: "/logos/collab/arrital.png" },
  { name: "San Carlo", logo: "/logos/collab/san-carlo.png" },
  { name: "Guy", logo: "/logos/collab/guy.png" },
  { name: "Junkers", logo: "/logos/collab/junkers.png" },
];

export default async function AboutPage() {
  const categories = await prisma.category.findMany({ orderBy: { name: "asc" } });

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} />
      <div className="main">
        <section className="about">
          <div className="about-portrait">
            <img src="/about/portrait-web.jpg" alt="Edoardo, Eddy Mack Tour" />
          </div>
          <div className="about-copy">
            <h2>About</h2>
            <p>
              Edoardo, aka Eddy Mack Tour, is an Italian filmmaker and director who works
              mainly with music videos, fashion films, documentaries, events, art and
              architecture.
            </p>
            <p className="about-contact">
              Contact: <a href="mailto:edocarraro1998@gmail.com">edocarraro1998@gmail.com</a>
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
