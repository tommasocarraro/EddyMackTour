"use client";

import { useEffect, useRef, useState } from "react";
import Thumbnail from "@/components/Thumbnail";
import { titleFromFileName, useVideoUpload, VideoUploadStatus } from "@/components/admin/VideoUpload";

type Props = {
  categories: string[];
  onCreated: () => void;
  onCancel: () => void;
  onUnsavedUploadChange: (unsaved: boolean) => void;
};

export default function AddProjectForm({ categories, onCreated, onCancel, onUnsavedUploadChange }: Props) {
  const [step, setStep] = useState<"url" | "details">("url");
  const [youtubeUrl, setYoutubeUrl] = useState("");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [thumbnailUrl, setThumbnailUrl] = useState<string | null>(null);
  const [thumbnailFilePreview, setThumbnailFilePreview] = useState<string | null>(null);
  const [fetchingMeta, setFetchingMeta] = useState(false);
  const [metaError, setMetaError] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);
  const upload = useVideoUpload();
  const uploadStatus = upload.state.status;
  const uploading = uploadStatus !== "idle";
  // An uploaded file has to be fully sent before the project can be saved.
  const canSave = !uploading || uploadStatus === "done";

  useEffect(() => {
    return () => {
      if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    };
  }, [thumbnailFilePreview]);

  useEffect(() => {
    onUnsavedUploadChange(uploadStatus === "uploading" || uploadStatus === "done");
  }, [uploadStatus, onUnsavedUploadChange]);

  async function onContinue(e: React.FormEvent) {
    e.preventDefault();
    const url = youtubeUrl.trim();
    if (!url) return;

    upload.discard();
    setFetchingMeta(true);
    setMetaError(null);
    try {
      const res = await fetch(`/api/video-metadata?url=${encodeURIComponent(url)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMetaError(data.error ?? "That doesn't look like a YouTube or Vimeo link — check it and try again.");
        return;
      }
      if (data.url) setYoutubeUrl(data.url);
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setThumbnailUrl(data.thumbnail ?? null);
      setStep("details");
    } catch {
      setMetaError("Couldn't look up that video — check your connection and try again.");
    } finally {
      setFetchingMeta(false);
    }
  }

  async function onVideoFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setMetaError(null);
    const url = await upload.start(file);
    if (!url) return;
    setYoutubeUrl(url);
    setTitle(titleFromFileName(file.name));
    setDescription("");
    setThumbnailUrl(null);
    setStep("details");
  }

  function onChangeVideo() {
    if (uploading) {
      upload.discard();
      setYoutubeUrl("");
    }
    setStep("url");
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

    const res = await fetch("/api/projects", { method: "POST", body: formData });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save this project.");
      return;
    }

    upload.commit();
    onCreated();
  }

  if (step === "url") {
    return (
      <form className="studio-form" onSubmit={onContinue}>
        <div className="steps">
          <span className="is-current">1 · Video</span>
          <span>2 · Details</span>
        </div>

        <div className="field">
          <label htmlFor="np-file">Upload a video file</label>
          <input id="np-file" className="file-input drop" type="file" accept="video/*" onChange={onVideoFileChange} />
          <span className="hint">
            Uploaded files aren&apos;t published anywhere else — they only play on this website.
          </span>
        </div>
        <VideoUploadStatus state={upload.state} />

        <div className="or-divider">or</div>

        <div className="field">
          <label htmlFor="np-link">Paste a YouTube or Vimeo link</label>
          <input
            id="np-link"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=... or https://vimeo.com/..."
            required
          />
          <span className="hint">
            We&apos;ll pull the title, description and thumbnail from the video — you can edit everything
            before saving.
          </span>
        </div>
        {metaError && <div className="error-text">{metaError}</div>}

        <div className="form-actions">
          <button className="btn ghost" type="button" onClick={onCancel}>
            Cancel
          </button>
          <button className="btn" type="submit" disabled={fetchingMeta}>
            {fetchingMeta ? "Fetching…" : "Continue"}
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="studio-form" ref={formRef} onSubmit={onSubmit}>
      <div className="steps">
        <span>1 · Video</span>
        <span className="is-current">2 · Details</span>
      </div>

      <input type="hidden" name="youtubeUrl" value={youtubeUrl} readOnly />
      <div className="video-summary">
        <div className="video-summary-main">
          <span className="eyebrow">{uploading ? "Video file" : "Video link"}</span>
          {uploading ? <VideoUploadStatus state={upload.state} /> : <span className="hint">{youtubeUrl}</span>}
        </div>
        <button className="btn ghost small" type="button" onClick={onChangeVideo}>
          Change
        </button>
      </div>

      <div className="field">
        <label htmlFor="np-title">Title</label>
        <input
          id="np-title"
          name="title"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="e.g. Harbor Light"
          required
        />
      </div>
      <div className="field">
        <label htmlFor="np-desc">Description</label>
        <textarea
          id="np-desc"
          name="description"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="What is this project about?"
          required
        />
      </div>

      <div className="field-row">
        <div className="field">
          <label htmlFor="np-client">Client</label>
          <input id="np-client" name="client" placeholder="e.g. Orsa Bicycles" />
        </div>
        <div className="field">
          <label htmlFor="np-role">Role</label>
          <input id="np-role" name="role" placeholder="e.g. Director, Editor" />
        </div>
        <div className="field field-year">
          <label htmlFor="np-year">Year</label>
          <input id="np-year" name="year" type="number" defaultValue={new Date().getFullYear()} required />
        </div>
      </div>

      <div className="field">
        <label htmlFor="np-thumb">Thumbnail</label>
        {(thumbnailFilePreview ?? thumbnailUrl) && (
          <Thumbnail
            src={thumbnailFilePreview ?? thumbnailUrl ?? ""}
            alt="Thumbnail preview"
            className="thumb-preview"
          />
        )}
        <input
          id="np-thumb"
          className="file-input"
          name="thumbnail"
          type="file"
          accept="image/*"
          onChange={onThumbnailFileChange}
        />
        <span className="hint">
          {uploading
            ? "A frame is picked from the video once it's processed — upload an image to use your own."
            : "Pulled from the video — upload an image to replace it."}
        </span>
      </div>

      <div className="field">
        <label>Categories</label>
        <div className="checklist">
          {categories.length === 0 && <span className="hint">Add a category first.</span>}
          {categories.map((c) => (
            <label key={c}>
              <input type="checkbox" name="categories" value={c} /> {c}
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
          {saving ? "Saving…" : uploadStatus === "uploading" ? "Uploading video…" : "Save project"}
        </button>
      </div>
    </form>
  );
}
