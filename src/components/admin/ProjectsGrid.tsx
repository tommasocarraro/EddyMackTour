"use client";

import Thumbnail from "@/components/Thumbnail";
import { getVideoProvider, type VideoProvider } from "@/lib/video";
import type { StudioProject } from "./types";

const SOURCE_LABELS: Record<VideoProvider, string> = {
  bunny: "Uploaded",
  youtube: "YouTube",
  vimeo: "Vimeo",
};

type Props = {
  projects: StudioProject[];
  onEdit: (id: string) => void;
  onChanged: () => void;
};

export default function ProjectsGrid({ projects, onEdit, onChanged }: Props) {
  async function remove(id: string, title: string) {
    if (!confirm(`Remove "${title}"? This can't be undone.`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    onChanged();
  }

  return (
    <div className="pgrid">
      {projects.map((p) => {
        const provider = getVideoProvider(p.youtubeUrl);
        return (
          <article className="pcard" key={p.id}>
            <button className="pcard-media" type="button" onClick={() => onEdit(p.id)} aria-label={`Edit ${p.title}`}>
              <Thumbnail src={p.thumbnail} alt="" className="pcard-thumb" />
              {provider && <span className={`source source-${provider}`}>{SOURCE_LABELS[provider]}</span>}
              <span className="pcard-year">{p.year}</span>
            </button>
            <div className="pcard-body">
              <h4>{p.title}</h4>
              {p.client && <div className="pcard-client">{p.client}</div>}
              <div className="cat-pills">
                {p.categories.map((c) => (
                  <span className="pill" key={c.name}>
                    {c.name}
                  </span>
                ))}
              </div>
            </div>
            <div className="pcard-actions">
              <button type="button" onClick={() => onEdit(p.id)}>
                Edit
              </button>
              <a href={`/project/${p.slug}`} target="_blank" rel="noopener noreferrer">
                View
              </a>
              <button className="danger" type="button" onClick={() => remove(p.id, p.title)}>
                Remove
              </button>
            </div>
          </article>
        );
      })}
    </div>
  );
}
