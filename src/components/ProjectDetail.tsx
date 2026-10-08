import type { Category, Project } from "@prisma/client";
import StreamPlayer from "@/components/StreamPlayer";
import Thumbnail from "@/components/Thumbnail";
import VideoPlayer from "@/components/VideoPlayer";
import { getVideoEmbedUrl } from "@/lib/video";

// Just the fields the detail view shows, so the gallery can hand them to the
// client-side dialog without serializing whole Prisma rows (Dates etc.).
export type ProjectDetailData = Pick<
  Project,
  "title" | "description" | "youtubeUrl" | "thumbnail" | "client" | "role" | "year"
> & {
  categories: Pick<Category, "name">[];
  // From getVideoStreamUrl: set for uploaded videos, which play in the site's own player.
  streamUrl: string | null;
};

export function ProjectPlayer({ project, autoplay = false }: { project: ProjectDetailData; autoplay?: boolean }) {
  const embedUrl = getVideoEmbedUrl(project.youtubeUrl, autoplay);

  return (
    <div className="player">
      {project.streamUrl ? (
        <StreamPlayer src={project.streamUrl} title={project.title} poster={project.thumbnail} autoplay={autoplay} />
      ) : embedUrl ? (
        <VideoPlayer embedUrl={embedUrl} title={project.title} poster={project.thumbnail} />
      ) : (
        <Thumbnail src={project.thumbnail} alt={project.title} className="still" />
      )}
    </div>
  );
}

export function ProjectInfo({ project }: { project: ProjectDetailData }) {
  return (
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
  );
}

// The full project page; the gallery's dialog lays the two parts out itself.
export default function ProjectDetail({ project }: { project: ProjectDetailData }) {
  return (
    <>
      <ProjectPlayer project={project} />
      <ProjectInfo project={project} />
    </>
  );
}
