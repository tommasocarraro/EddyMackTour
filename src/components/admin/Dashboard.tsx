"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { getVideoProvider } from "@/lib/video";
import ProjectsGrid from "./ProjectsGrid";
import AddProjectForm from "./AddProjectForm";
import EditProjectForm from "./EditProjectForm";
import CategoryPanel from "./CategoryPanel";
import Drawer from "./Drawer";
import type { StudioCategory, StudioProject } from "./types";

type Panel = { mode: "add" } | { mode: "edit"; id: string } | null;

export default function Dashboard() {
  const [projects, setProjects] = useState<StudioProject[]>([]);
  const [categories, setCategories] = useState<StudioCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [panel, setPanel] = useState<Panel>(null);
  const [unsavedUpload, setUnsavedUpload] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<string | null>(null);

  const load = useCallback(async () => {
    const [projectsRes, categoriesRes] = await Promise.all([
      fetch("/api/projects"),
      fetch("/api/categories"),
    ]);
    setProjects(await projectsRes.json());
    setCategories(await categoriesRes.json());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const categoryNames = useMemo(() => categories.map((c) => c.name), [categories]);

  const counts = useMemo(() => {
    const result: Record<string, number> = {};
    for (const p of projects) for (const c of p.categories) result[c.name] = (result[c.name] ?? 0) + 1;
    return result;
  }, [projects]);

  const uploadedCount = useMemo(
    () => projects.filter((p) => getVideoProvider(p.youtubeUrl) === "bunny").length,
    [projects]
  );

  const visible = useMemo(() => {
    const q = query.trim().toLowerCase();
    return projects.filter(
      (p) =>
        (!filter || p.categories.some((c) => c.name === filter)) &&
        (!q || p.title.toLowerCase().includes(q) || (p.client ?? "").toLowerCase().includes(q))
    );
  }, [projects, query, filter]);

  // Closing the panel discards a video that was uploaded but not saved yet.
  const closePanel = useCallback(() => {
    if (unsavedUpload && !confirm("The video you uploaded isn't saved yet. Close and discard it?")) return;
    setUnsavedUpload(false);
    setPanel(null);
  }, [unsavedUpload]);

  function onSaved() {
    setUnsavedUpload(false);
    setPanel(null);
    load();
  }

  const editing = panel?.mode === "edit" ? projects.find((p) => p.id === panel.id) : undefined;

  return (
    <div className="studio-shell wide">
      <header className="studio-head">
        <div>
          <span className="eyebrow">Studio</span>
          <h2>Your projects</h2>
        </div>
        <button className="btn" type="button" onClick={() => setPanel({ mode: "add" })}>
          <svg viewBox="0 0 24 24" width="15" height="15" fill="none" stroke="currentColor" strokeWidth="2.2">
            <path d="M12 5v14M5 12h14" />
          </svg>
          New project
        </button>
      </header>

      <dl className="stats">
        <div>
          <dt>Projects</dt>
          <dd>{loading ? "–" : projects.length}</dd>
        </div>
        <div>
          <dt>Categories</dt>
          <dd>{loading ? "–" : categories.length}</dd>
        </div>
        <div>
          <dt>Uploaded files</dt>
          <dd>{loading ? "–" : uploadedCount}</dd>
        </div>
        <div>
          <dt>YouTube / Vimeo links</dt>
          <dd>{loading ? "–" : projects.length - uploadedCount}</dd>
        </div>
      </dl>

      <div className="toolbar">
        <label className="search">
          <svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" strokeWidth="1.8">
            <circle cx="11" cy="11" r="6.5" />
            <path d="M16 16l4.5 4.5" />
          </svg>
          <input
            type="search"
            placeholder="Search by title or client"
            aria-label="Search projects"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
        </label>
        <div className="filter-chips">
          <button type="button" className={filter === null ? "is-active" : ""} onClick={() => setFilter(null)}>
            All
          </button>
          {categoryNames.map((name) => (
            <button
              type="button"
              key={name}
              className={filter === name ? "is-active" : ""}
              onClick={() => setFilter(filter === name ? null : name)}
            >
              {name} <span className="count">{counts[name] ?? 0}</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="pgrid" aria-hidden="true">
          {Array.from({ length: 8 }, (_, i) => (
            <div className="pcard is-skeleton" key={i} />
          ))}
        </div>
      ) : projects.length === 0 ? (
        <div className="studio-empty">
          <h3>No projects yet</h3>
          <p>Upload a video or paste a link to add the first one.</p>
          <button className="btn" type="button" onClick={() => setPanel({ mode: "add" })}>
            New project
          </button>
        </div>
      ) : visible.length === 0 ? (
        <div className="studio-empty">
          <h3>Nothing matches</h3>
          <p>No project fits that search or category.</p>
          <button
            className="btn ghost"
            type="button"
            onClick={() => {
              setQuery("");
              setFilter(null);
            }}
          >
            Clear filters
          </button>
        </div>
      ) : (
        <ProjectsGrid projects={visible} onEdit={(id) => setPanel({ mode: "edit", id })} onChanged={load} />
      )}

      {!loading && <CategoryPanel categories={categories} counts={counts} onAdded={load} />}

      {panel?.mode === "add" && (
        <Drawer title="New project" onClose={closePanel}>
          <AddProjectForm
            categories={categoryNames}
            onCreated={onSaved}
            onCancel={closePanel}
            onUnsavedUploadChange={setUnsavedUpload}
          />
        </Drawer>
      )}
      {editing && (
        <Drawer title="Edit project" onClose={closePanel}>
          <EditProjectForm
            key={editing.id}
            project={editing}
            categories={categoryNames}
            onSaved={onSaved}
            onCancel={closePanel}
            onUnsavedUploadChange={setUnsavedUpload}
          />
        </Drawer>
      )}
    </div>
  );
}
