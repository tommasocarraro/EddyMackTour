import type { Category, Project } from "@prisma/client";
import Thumbnail from "@/components/Thumbnail";
import YoutubePlayer from "@/components/YoutubePlayer";
import { getYoutubeEmbedUrl } from "@/lib/youtube";

// Just the fields the detail view shows, so the gallery can hand them to the
// client-side dialog without serializing whole Prisma rows (Dates etc.).
export type ProjectDetailData = Pick<
  Project,
  "title" | "description" | "youtubeUrl" | "thumbnail" | "client" | "role" | "year"
> & { categories: Pick<Category, "name">[] };

export default function ProjectDetail({ project }: { project: ProjectDetailData }) {
  const embedUrl = getYoutubeEmbedUrl(project.youtubeUrl);

  return (
    <>
      <div className="player">
        {embedUrl ? (
          <YoutubePlayer embedUrl={embedUrl} title={project.title} poster={project.thumbnail} />
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
