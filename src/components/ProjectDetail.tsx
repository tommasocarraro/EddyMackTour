import type { Category, Project } from "@prisma/client";
import Thumbnail from "@/components/Thumbnail";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

export default function ProjectDetail({ project }: { project: Project & { categories: Category[] } }) {
  const embedUrl = getYoutubeEmbedUrl(project.youtubeUrl);

  return (
    <>
      <div className="player">
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={project.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <Thumbnail src={project.thumbnail} alt={project.title} className="still" />
        )}
      </div>

      <div className="detail-body">
        <p>{project.description}</p>
        <div className="credits">
          <div>
            <b>Category</b>
            {project.categories.map((c) => c.name).join(" / ")}
          </div>
          {project.client && (
            <div>
              <b>Client</b>
              {project.client}
            </div>
          )}
          {project.role && (
            <div>
              <b>Role</b>
              {project.role}
            </div>
          )}
          <div>
            <b>Year</b>
            {project.year}
          </div>
        </div>
      </div>
    </>
  );
}
