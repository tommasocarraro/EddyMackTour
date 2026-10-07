"use client";

import { useEffect, useRef, useState } from "react";
import Thumbnail from "@/components/Thumbnail";
import { useVideoUpload, VideoUploadStatus } from "@/components/admin/VideoUpload";
import type { StudioProject } from "./types";

type Props = {
  project: StudioProject;
  categories: string[];
  onSaved: () => void;
  onCancel: () => void;
  onUnsavedUploadChange: (unsaved: boolean) => void;
};

export default function EditProjectForm({ project, categories, onSaved, onCancel, onUnsavedUploadChange }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [thumbnailUrl, setThumbnailUrl] = useState(project.thumbnail);
  const [thumbnailFilePreview, setThumbnailFilePreview] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);
  const titleRef = useRef<HTMLInputElement>(null);
  const descRef = useRef<HTMLTextAreaElement>(null);
  const linkRef = useRef<HTMLInputElement>(null);
  const upload = useVideoUpload();
  const uploadStatus = upload.state.status;
  // An uploaded file has to be fully sent before the project can be saved.
  const canSave = uploadStatus !== "uploading";
  const selectedCategories = new Set(project.categories.map((c) => c.name));

  useEffect(() => {
    return () => {
      if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    };
  }, [thumbnailFilePreview]);

  useEffect(() => {
    onUnsavedUploadChange(uploadStatus === "uploading" || uploadStatus === "done");
  }, [uploadStatus, onUnsavedUploadChange]);

  async function onVideoUrlBlur(e: React.FocusEvent<HTMLInputElement>) {
    const url = e.target.value.trim();
    if (!url) return;
    const titleEmpty = !titleRef.current?.value.trim();
    const descEmpty = !descRef.current?.value.trim();

    setFetchingMeta(true);
    try {
      const res = await fetch(`/api/video-metadata?url=${encodeURIComponent(url)}`);
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

  // Replaces the project's video with an uploaded file: the link field then
  // holds the new file's player URL.
  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const url = await upload.start(file);
    if (linkRef.current) linkRef.current.value = url ?? project.youtubeUrl;
  }

  // A failed upload is discarded, so the project keeps the video it had.
  useEffect(() => {
    if (uploadStatus === "error" && linkRef.current) linkRef.current.value = project.youtubeUrl;
  }, [uploadStatus, project.youtubeUrl]);

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

    upload.commit();
    onSaved();
  }

  return (
    <form className="studio-form" ref={formRef} onSubmit={onSubmit}>
      <div className="field">
        <label htmlFor="ep-title">Title</label>
        <input id="ep-title" name="title" ref={titleRef} defaultValue={project.title} required />
      </div>
      <div className="field">
        <label htmlFor="ep-desc">Description</label>
        <textarea id="ep-desc" name="description" ref={descRef} defaultValue={project.description} required />
      </div>

      <fieldset className="form-group">
        <legend>Video</legend>
        <div className="field">
          <label htmlFor="ep-link">Link (YouTube or Vimeo)</label>
          <input
            id="ep-link"
            name="youtubeUrl"
            ref={linkRef}
            defaultValue={project.youtubeUrl}
            required
            readOnly={uploadStatus === "uploading" || uploadStatus === "done"}
            onBlur={onVideoUrlBlur}
          />
          {fetchingMeta && <span className="hint">Fetching details from the video…</span>}
        </div>
        <div className="field">
          <label htmlFor="ep-file">Or replace it with an uploaded file</label>
          <input id="ep-file" className="file-input" type="file" accept="video/*" onChange={onVideoFileChange} />
          <VideoUploadStatus state={upload.state} />
        </div>
      </fieldset>

      <div className="field-row">
        <div className="field">
          <label htmlFor="ep-client">Client</label>
          <input id="ep-client" name="client" defaultValue={project.client ?? ""} />
        </div>
        <div className="field">
          <label htmlFor="ep-role">Role</label>
          <input id="ep-role" name="role" defaultValue={project.role ?? ""} />
        </div>
        <div className="field field-year">
          <label htmlFor="ep-year">Year</label>
          <input id="ep-year" name="year" type="number" defaultValue={project.year} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="ep-thumb">Thumbnail</label>
        {(thumbnailFilePreview ?? thumbnailUrl) && (
          <Thumbnail src={thumbnailFilePreview ?? thumbnailUrl} alt="Thumbnail preview" className="thumb-preview" />
        )}
        <input
          id="ep-thumb"
          className="file-input"
          name="thumbnail"
          type="file"
          accept="image/*"
          onChange={onThumbnailFileChange}
        />
        <span className="hint">It follows the video unless you upload an image of your own.</span>
      </div>

      <div className="field">
        <label>Categories</label>
        <div className="checklist">
          {categories.length === 0 && <span className="hint">Add a category first.</span>}
          {categories.map((c) => (
            <label key={c}>
              <input type="checkbox" name="categories" value={c} defaultChecked={selectedCategories.has(c)} /> {c}
            </label>
          ))}
        </div>
      </div>

      {error && <div className="error-text">{error}</div>}
      <div className="form-actions">
        <button className="btn ghost" type="button" onClick={onCancel}>
          Cancel
        </button>
        <button className="btn" type="submit" disabled={saving || !canSave}>
          {saving ? "Saving…" : uploadStatus === "uploading" ? "Uploading video…" : "Save changes"}
        </button>
      </div>
    </form>
  );
}
