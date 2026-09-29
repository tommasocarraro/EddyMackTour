import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProjectDetail from "@/components/ProjectDetail";
import ProjectModal from "@/components/ProjectModal";

export const dynamic = "force-dynamic";

// Intercepts /project/[slug] on client-side navigation from the gallery, so the
// project opens as a dialog over the grid. A direct visit or refresh still
// renders the full page at src/app/project/[slug]/page.tsx.
export default async function ProjectModalPage({ params }: { params: { slug: string } }) {
  const project = await prisma.project.findUnique({
    where: { slug: params.slug },
    include: { categories: true },
  });

  if (!project) notFound();

  return (
    <ProjectModal title={project.title}>
      <ProjectDetail project={project} />
    </ProjectModal>
  );
}
