"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import ProjectDetail, { type ProjectDetailData } from "@/components/ProjectDetail";
import ProjectModal from "@/components/ProjectModal";
import Thumbnail from "@/components/Thumbnail";

export type GalleryProject = ProjectDetailData & { id: string; slug: string };

// Clicking a card opens the project as a dialog straight from the data already
// on the page (no server round trip, so the open animation starts on click).
// The URL still changes to /project/[slug] via history.pushState, which Next
// keeps in sync with usePathname; back/refresh/direct visits behave as usual.
export default function Gallery({ projects }: { projects: GalleryProject[] }) {
  const pathname = usePathname();
  const openSlug = pathname.startsWith("/project/") ? decodeURIComponent(pathname.slice("/project/".length)) : null;
  const open = openSlug ? projects.find((p) => p.slug === openSlug) : undefined;

  return (
    <>
      <section className="gallery">
        {projects.map((p) => (
          <Link
            key={p.id}
            className="card"
            data-slug={p.slug}
            href={`/project/${p.slug}`}
            onClick={(e) => {
              // Let modified clicks (new tab etc.) through as normal links.
              if (e.button !== 0 || e.metaKey || e.ctrlKey || e.shiftKey || e.altKey) return;
              e.preventDefault();
              window.history.pushState(null, "", `/project/${p.slug}`);
            }}
          >
            <Thumbnail src={p.thumbnail} alt={p.title} className="still" />
            <div className="card-meta">
              <span className="cat">{p.categories.map((c) => c.name).join(" / ")}</span>
              <span className="title">{p.title}</span>
              <span className="year">{p.year}</span>
            </div>
          </Link>
        ))}
      </section>

      {open && (
        <ProjectModal key={open.slug} slug={open.slug} title={open.title}>
          <ProjectDetail project={open} />
        </ProjectModal>
      )}
    </>
  );
}
