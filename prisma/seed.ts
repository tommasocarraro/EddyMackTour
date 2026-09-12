import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const projects = [
  {
    title: "Harbor Light",
    slug: "harbor-light",
    description:
      "A season with the last three lantern-keepers on the Ligurian coast, filmed over four winters as their lighthouses were slated for automation.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-1.svg",
    client: "Self-initiated",
    role: "Director, Editor",
    year: 2025,
    categories: ["Personal Project"],
  },
  {
    title: "Salt & Steel",
    slug: "salt-and-steel",
    description:
      "A launch film for Orsa's coastal touring frame, shot along the same switchbacks the brand's founders rode as kids.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-2.svg",
    client: "Orsa Bicycles",
    role: "Director, DP",
    year: 2025,
    categories: ["Commercial", "Campaign"],
  },
  {
    title: "The Long Set",
    slug: "the-long-set",
    description:
      "A single unbroken take through a warehouse rehearsal space, following the Marlow Trio through the last song of a five-hour set.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-3.svg",
    client: "Marlow Trio",
    role: "Director, Editor",
    year: 2024,
    categories: ["Music Video"],
  },
  {
    title: "Field Notes",
    slug: "field-notes",
    description:
      "Three agronomists spend a year converting a family vineyard to dry farming, tracked through the four seasons of transition.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-4.svg",
    client: "Self-initiated",
    role: "Director, DP, Editor",
    year: 2023,
    categories: ["Personal Project", "Documentary"],
  },
  {
    title: "Night Shift",
    slug: "night-shift",
    description:
      "A brand film following the overnight crew that keeps a century-old print house running, cut to the rhythm of the presses.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-5.svg",
    client: "Torbin Press Co.",
    role: "Director, Editor",
    year: 2024,
    categories: ["Commercial", "Documentary"],
  },
  {
    title: "Concrete Bloom",
    slug: "concrete-bloom",
    description:
      "A rooftop garden collective reclaims an abandoned parking structure block by block, shot in timelapse over eighteen months.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-6.svg",
    client: "Self-initiated",
    role: "Director, DP",
    year: 2022,
    categories: ["Personal Project"],
  },
  {
    title: "Low Tide",
    slug: "low-tide",
    description:
      "A music video for Reva Lang's title track, shot at dawn on a tidal flat before the water returns.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-7.svg",
    client: "Reva Lang",
    role: "Director, Editor",
    year: 2025,
    categories: ["Music Video"],
  },
  {
    title: "Winter Route",
    slug: "winter-route",
    description:
      "A campaign film following three riders testing Orsa's new all-weather line across an alpine supply route.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-8.svg",
    client: "Orsa Bicycles",
    role: "Director, DP",
    year: 2024,
    categories: ["Commercial", "Campaign"],
  },
  {
    title: "Paper Trail",
    slug: "paper-trail",
    description:
      "A short documentary on the last letterpress binder in the city, and the archive of type she refuses to sell.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-9.svg",
    client: "Self-initiated",
    role: "Director, Editor",
    year: 2021,
    categories: ["Documentary"],
  },
  {
    title: "Backline",
    slug: "backline",
    description:
      "A tour diary shot across six cities with the Marlow Trio's crew, focused on the roadies rather than the stage.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-10.svg",
    client: "Marlow Trio",
    role: "DP, Editor",
    year: 2023,
    categories: ["Music Video", "Documentary"],
  },
  {
    title: "Signal Fire",
    slug: "signal-fire",
    description:
      "A brand campaign for a headlamp launch, filmed with volunteer search-and-rescue teams on a real callout.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-11.svg",
    client: "Kepler Gear",
    role: "Director, DP, Editor",
    year: 2025,
    categories: ["Commercial", "Campaign"],
  },
  {
    title: "Between Sets",
    slug: "between-sets",
    description:
      "Backstage portraits and unguarded moments from a summer festival run, cut together without any performance footage.",
    youtubeUrl: "https://www.youtube.com/watch?v=dQw4w9WgXcQ",
    thumbnail: "/seed-thumbs/placeholder-12.svg",
    client: "Self-initiated",
    role: "Director, Editor",
    year: 2022,
    categories: ["Personal Project", "Music Video"],
  },
];

async function main() {
  for (const p of projects) {
    const { categories, ...data } = p;
    await prisma.project.upsert({
      where: { slug: p.slug },
      update: {},
      create: {
        ...data,
        categories: {
          connectOrCreate: categories.map((name) => ({ where: { name }, create: { name } })),
        },
      },
    });
  }
}

main()
  .then(() => prisma.$disconnect())
  .catch(async (e) => {
    console.error(e);
    await prisma.$disconnect();
    process.exit(1);
  });
