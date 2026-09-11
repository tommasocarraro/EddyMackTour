"use client";

import { useCallback, useEffect, useState } from "react";
import ProjectsTable from "./ProjectsTable";
import AddProjectForm from "./AddProjectForm";
import CategoryPanel from "./CategoryPanel";

type Category = { id: string; name: string };
type Project = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  year: number;
  categories: Category[];
};

export default function Dashboard() {
  const [projects, setProjects] = useState<Project[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [formOpen, setFormOpen] = useState(false);

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

  if (loading) return null;

  return (
    <div className="studio-shell wide">
      <div className="dash-top">
        <h2>Your projects</h2>
        <button className="btn" type="button" onClick={() => setFormOpen((v) => !v)}>
          {formOpen ? "Cancel" : "Add project"}
        </button>
      </div>
      <AddProjectForm
        categories={categories.map((c) => c.name)}
        open={formOpen}
        onOpenChange={setFormOpen}
        onCreated={load}
      />
      <ProjectsTable projects={projects} onDeleted={load} />
      <CategoryPanel categories={categories.map((c) => c.name)} onAdded={load} />
    </div>
  );
}
