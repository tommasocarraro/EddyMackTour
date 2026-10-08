import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import Sidebar from "@/components/Sidebar";
import ProjectDetail from "@/components/ProjectDetail";
import { getVideoStreamUrl } from "@/lib/video";

export const dynamic = "force-dynamic";

export default async function ProjectPage({ params }: { params: { slug: string } }) {
  const [project, categories] = await Promise.all([
    prisma.project.findUnique({
      where: { slug: params.slug },
      include: { categories: true },
    }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);

  if (!project) notFound();

  const all = await prisma.project.findMany({
    orderBy: [{ order: "asc" }, { year: "desc" }],
    select: { id: true, slug: true, title: true },
  });
  const idx = all.findIndex((p) => p.id === project.id);
  const next = all[(idx + 1) % all.length];

  return (
    <>
      <Sidebar categories={categories.map((c) => c.name)} />
      <div className="main">
        <div className="detail-head">
          <Link className="back-link" href="/">
            &larr; All work
          </Link>
          <h2>{project.title}</h2>
        </div>

        <ProjectDetail project={{ ...project, streamUrl: getVideoStreamUrl(project.youtubeUrl) }} />

        {next && next.id !== project.id && (
          <Link className="next-project" href={`/project/${next.slug}`}>
            <div>
              <div className="label">Next project</div>
              <div className="np-title">{next.title}</div>
            </div>
            <span className="arrow">&rarr;</span>
          </Link>
        )}

        <footer className="site">
          <span>© {new Date().getFullYear()} Eddy Mack Tour</span>
          <span>Reel available on request</span>
        </footer>
      </div>
    </>
  );
}
