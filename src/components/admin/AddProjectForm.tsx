"use client";

import { useRef, useState } from "react";

type Props = {
  categories: string[];
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onCreated: () => void;
};

export default function AddProjectForm({ categories, open, onOpenChange, onCreated }: Props) {
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const formRef = useRef<HTMLFormElement>(null);

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
    onOpenChange(false);
    onCreated();
  }

  return (
    <>
      {open && (
        <form className="cat-panel" ref={formRef} onSubmit={onSubmit}>
          <h3>New project</h3>
          <div className="field">
            <label htmlFor="np-title">Title</label>
            <input id="np-title" name="title" placeholder="e.g. Harbor Light" required />
          </div>
          <div className="field">
            <label htmlFor="np-desc">Description</label>
            <textarea id="np-desc" name="description" placeholder="What is this project about?" required />
          </div>
          <div className="field">
            <label htmlFor="np-link">YouTube link</label>
            <input id="np-link" name="youtubeUrl" placeholder="https://youtube.com/watch?v=..." required />
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
            <label htmlFor="np-thumb">Thumbnail</label>
            <input id="np-thumb" name="thumbnail" type="file" accept="image/*" required />
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
          <button className="btn" type="submit" disabled={saving}>
            {saving ? "Saving…" : "Save project"}
          </button>
        </form>
      )}
    </>
  );
}
