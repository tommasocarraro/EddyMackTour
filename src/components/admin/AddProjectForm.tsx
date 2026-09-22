"use client";

import { useEffect, useRef, useState } from "react";
import Thumbnail from "@/components/Thumbnail";

type Props = {
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export default function AddProjectForm({ categories, open, onOpenChange, onCreated }: Props) {
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

  useEffect(() => {
    return () => {
      if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    };
  }, [thumbnailFilePreview]);

  function reset() {
    setStep("url");
    setYoutubeUrl("");
    setTitle("");
    setDescription("");
    setThumbnailUrl(null);
    if (thumbnailFilePreview) URL.revokeObjectURL(thumbnailFilePreview);
    setThumbnailFilePreview(null);
    setMetaError(null);
    setError(null);
  }

  async function onContinue(e: React.FormEvent) {
    e.preventDefault();
    const url = youtubeUrl.trim();
    if (!url) return;

    setFetchingMeta(true);
    setMetaError(null);
    try {
      const res = await fetch(`/api/youtube-metadata?url=${encodeURIComponent(url)}`);
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        setMetaError(data.error ?? "That doesn't look like a YouTube link — check it and try again.");
        return;
      }
      setTitle(data.title ?? "");
      setDescription(data.description ?? "");
      setThumbnailUrl(data.thumbnail ?? null);
      setStep("details");
    } catch {
      setMetaError("Couldn't reach YouTube — check your connection and try again.");
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

    const res = await fetch("/api/projects", { method: "POST", body: formData });
    setSaving(false);

    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      setError(body.error ?? "Could not save this project.");
      return;
    }

    formRef.current.reset();
    reset();
    onOpenChange(false);
    onCreated();
  }

  if (!open) return null;

  if (step === "url") {
    return (
      <form className="cat-panel" onSubmit={onContinue}>
        <h3>New project</h3>
        <div className="field">
          <label htmlFor="np-link">YouTube link</label>
          <input
            id="np-link"
            value={youtubeUrl}
            onChange={(e) => setYoutubeUrl(e.target.value)}
            placeholder="https://youtube.com/watch?v=..."
            required
            autoFocus
          />
          <span className="sub">
            We&apos;ll pull the title, description and thumbnail from YouTube — you can edit
            everything before saving.
          </span>
        </div>
        {metaError && <div className="error-text">{metaError}</div>}
        <div className="row-actions edit-actions">
          <button className="btn" type="submit" disabled={fetchingMeta}>
            {fetchingMeta ? "Fetching…" : "Continue"}
          </button>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              reset();
              onOpenChange(false);
            }}
          >
            Cancel
          </button>
        </div>
      </form>
    );
  }

  return (
    <form className="cat-panel" ref={formRef} onSubmit={onSubmit}>
      <h3>New project</h3>
      <input type="hidden" name="youtubeUrl" value={youtubeUrl} readOnly />
      <div className="field">
        <label>YouTube link</label>
        <div className="row-title">
          <span className="sub">{youtubeUrl}</span>
          <button className="btn ghost" type="button" onClick={() => setStep("url")}>
            Change
          </button>
        </div>
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
      <div className="field">
        <label htmlFor="np-client">Client</label>
        <input id="np-client" name="client" placeholder="e.g. Orsa Bicycles (or Self-initiated)" />
      </div>
      <div className="field">
        <label htmlFor="np-role">Role</label>
        <input id="np-role" name="role" placeholder="e.g. Director, Editor" />
      </div>
      <div className="field">
        <label htmlFor="np-year">Year</label>
        <input id="np-year" name="year" type="number" defaultValue={new Date().getFullYear()} required />
      </div>
      <div className="field">
        <label htmlFor="np-thumb">Thumbnail (pulled from YouTube — upload a file to replace it)</label>
        {(thumbnailFilePreview ?? thumbnailUrl) && (
          <Thumbnail
            src={thumbnailFilePreview ?? thumbnailUrl ?? ""}
            alt="Thumbnail preview"
            className="thumb-preview"
          />
        )}
        <input id="np-thumb" name="thumbnail" type="file" accept="image/*" onChange={onThumbnailFileChange} />
      </div>
      <div className="field">
        <label>Categories</label>
        <div className="checklist">
          {categories.length === 0 && (
            <span className="sub">Add a category below first.</span>
          )}
          {categories.map((c) => (
            <label key={c}>
              <input type="checkbox" name="categories" value={c} /> {c}
            </label>
          ))}
        </div>
      </div>
      {error && <div className="error-text">{error}</div>}
      <div className="row-actions edit-actions">
        <button className="btn" type="submit" disabled={saving}>
          {saving ? "Saving…" : "Save project"}
        </button>
        <button
          className="btn ghost"
          type="button"
          onClick={() => {
            reset();
            onOpenChange(false);
          }}
        >
          Cancel
        </button>
      </div>
    </form>
  );
}
