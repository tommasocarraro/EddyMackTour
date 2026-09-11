import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";

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
          <section className="gallery">
            {projects.map((p) => (
              <Link key={p.id} className="card" href={`/project/${p.slug}`}>
                <div className="still" style={{ backgroundImage: `url(${p.thumbnail})` }} />
                <div className="card-meta">
                  <span className="cat">{p.categories.map((c) => c.name).join(" / ")}</span>
                  <span className="title">{p.title}</span>
                  <span className="year">{p.year}</span>
                </div>
              </Link>
            ))}
          </section>
        )}
      </div>
    </>
  );
}
