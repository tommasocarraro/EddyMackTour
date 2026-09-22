"use client";

import Link from "next/link";
import { Fragment, useEffect, useRef, useState } from "react";
import Thumbnail from "@/components/Thumbnail";

type Project = {
  id: string;
  title: string;
  slug: string;
  description: string;
  youtubeUrl: string;
  client: string | null;
  role: string | null;
  thumbnail: string;
  year: number;
  categories: { name: string }[];
};

type Props = {
  projects: Project[];
  categories: string[];
  onChanged: () => void;
};

export default function ProjectsTable({ projects, categories, onChanged }: Props) {
  const [editingId, setEditingId] = useState<string | null>(null);

  async function remove(id: string, title: string) {
    if (!confirm(`Remove "${title}"? This can't be undone.`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    onChanged();
  }

  if (projects.length === 0) {
    return <p className="empty-state">No projects yet — add the first one above.</p>;
  }

  return (
    <table className="proj">
      <thead>
        <tr>
          <th>Project</th>
          <th>Categories</th>
          <th>Year</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {projects.map((p) => (
          <Fragment key={p.id}>
            <tr>
              <td>
                <div className="row-title">
                  <Thumbnail src={p.thumbnail} alt={p.title} className="thumb-sm" />
                  <b>{p.title}</b>
                </div>
              </td>
              <td>
                <div className="cat-pills">
                  {p.categories.map((c) => (
                    <span className="pill" key={c.name}>
                      {c.name}
                    </span>
                  ))}
                </div>
              </td>
              <td>{p.year}</td>
              <td>
                <div className="row-actions">
                  <Link href={`/project/${p.slug}`}>View</Link>
                  <button
                    type="button"
                    onClick={() => setEditingId(editingId === p.id ? null : p.id)}
                  >
                    {editingId === p.id ? "Close" : "Edit"}
                  </button>
                  <button className="danger" onClick={() => remove(p.id, p.title)}>
                    Remove
                  </button>
                </div>
              </td>
            </tr>
            {editingId === p.id && (
              <tr>
                <td colSpan={4}>
                  <EditProjectForm
                    project={p}
                    categories={categories}
                    onSaved={() => {
                      setEditingId(null);
                      onChanged();
                    }}
                    onCancel={() => setEditingId(null)}
                  />
                </td>
              </tr>
            )}
          </Fragment>
        ))}
      </tbody>
    </table>
  );
}

function EditProjectForm({
  project,
  categories,
  onSaved,
  onCancel,
}: {
  project: Project;
  categories: string[];
  onSaved: () => void;
  onCancel: () => void;
}) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnail);
  const [thumbnailFilePreview, setThumbnailFilePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const selectedCategories = new Set(project.categories.map((c) => c.name));

  useEffect(() => {
    return () => {
      if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    };
  }, [thumbnailFilePreview]);

  async function onYoutubeUrlBlur(e: React.FocusEvent<HTMLInputElement>) {
    const url = e.target.value.trim();
    if (!url) return;
    const titleEmpty = !titleRef.current?.value.trim();
    const descEmpty = !descRef.current?.value.trim();

    setFetchingMeta(true);
    try {
      const res = await fetch(`/api/youtube-metadata?url=${encodeURIComponent(url)}`);
      if (res.ok) {
        const data = await res.json();
        if (titleEmpty && titleRef.current && data.title) titleRef.current.value = data.title;
        if (descEmpty && descRef.current && data.description) descRef.current.value = data.description;
        if (data.thumbnail) setThumbnailUrl(data.thumbnail);
      }
    } catch {
      // Non-fatal — the admin can still fill these in / pick a thumbnail manually.
    } finally {
      setFetchingMeta(false);
    }
  }

  function onThumbnailFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    const file = e.target.files?.[0];
    setThumbnailFilePreview(file ? URL.createObjectURL(file) : null);
  }

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!formRef.current) return;
    setSaving(true);
    setError(null);

    const formData = new FormData(formRef.current);

    const res = await fetch(`/api/projects/${project.id}`, { method: "PATCH", body: formData });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save this project.");
      return;
    }

    onSaved();
  }

  return (
    <form className="cat-panel edit-form" ref={formRef} onSubmit={onSubmit}>
      <h3>Edit project</h3>
      <div className="field">
        <label htmlFor={`ep-title-${project.id}`}>Title</label>
        <input
          id={`ep-title-${project.id}`}
          name="title"
          ref={titleRef}
          defaultValue={project.title}
          required
        />
      </div>
      <div className="field">
        <label htmlFor={`ep-desc-${project.id}`}>Description</label>
        <textarea
          id={`ep-desc-${project.id}`}
          name="description"
          ref={descRef}
          defaultValue={project.description}
          required
        />
      </div>
      <div className="field">
        <label htmlFor={`ep-link-${project.id}`}>YouTube link</label>
        <input
          id={`ep-link-${project.id}`}
          name="youtubeUrl"
          defaultValue={project.youtubeUrl}
          required
          onBlur={onYoutubeUrlBlur}
        />
        {fetchingMeta && <span className="sub">Fetching details from YouTube…</span>}
      </div>
      <div className="field">
        <label htmlFor={`ep-client-${project.id}`}>Client</label>
        <input id={`ep-client-${project.id}`} name="client" defaultValue={project.client ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`ep-role-${project.id}`}>Role</label>
        <input id={`ep-role-${project.id}`} name="role" defaultValue={project.role ?? ""} />
      </div>
      <div className="field">
        <label htmlFor={`ep-year-${project.id}`}>Year</label>
        <input id={`ep-year-${project.id}`} name="year" type="number" defaultValue={project.year} required />
      </div>
      <div className="field">
        <label htmlFor={`ep-thumb-${project.id}`}>
          Thumbnail (replace by uploading a file — otherwise it stays in sync with the YouTube link)
        </label>
        {(thumbnailFilePreview ?? thumbnailUrl) && (
          <Thumbnail
            src={thumbnailFilePreview ?? thumbnailUrl}
            alt="Thumbnail preview"
            className="thumb-preview"
          />
        )}
        <input
          id={`ep-thumb-${project.id}`}
          name="thumbnail"
          type="file"
          accept="image/*"
          onChange={onThumbnailFileChange}
        />
      </div>
      <div className="field">
        <label>Categories</label>
        <div className="checklist">
          {categories.length === 0 && <span className="sub">Add a category first.</span>}
          {categories.map((c) => (
            <label key={c}>
              <input type="checkbox" name="categories" value={c} defaultChecked={selectedCategories.has(c)} /> {c}
            </label>
          ))}
        </div>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="row-actions edit-actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save changes"}
        </button>
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
      </div>
    </form>
  );
}
