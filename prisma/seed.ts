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
