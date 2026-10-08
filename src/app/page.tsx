import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import Gallery from "@/components/Gallery";
import { getVideoStreamUrl } from "@/lib/video";

export const dynamic = "force-dynamic";

export default async function GalleryPage({
  searchParams,
}: {
  searchParams: { category?: string };
}) {
  const category = searchParams.category;

  const [projects, categories] = await Promise.all([
    prisma.project.findMany({
      where: category ? { categories: { some: { name: category } } } : undefined,
      include: { categories: true },
      orderBy: [{ order: "asc" }, { year: "desc" }],
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} activeCategory={category} />
      <div className="main">
        {projects.length === 0 ? (
          <p className="empty-state">
            {category ? `No projects tagged "${category}" yet.` : "No projects yet — add the first one in the Studio."}
          </p>
        ) : (
          <Gallery
            projects={projects.map((p) => ({
              id: p.id,
              slug: p.slug,
              title: p.title,
              description: p.description,
              youtubeUrl: p.youtubeUrl,
              streamUrl: getVideoStreamUrl(p.youtubeUrl),
              thumbnail: p.thumbnail,
              client: p.client,
              role: p.role,
              year: p.year,
              categories: p.categories.map((c) => ({ name: c.name })),
            }))}
          />
        )}
      </div>
    </>
  );
}
