"use client";

import Link from "next/link";

type Project = {
  id: string;
  title: string;
  slug: string;
  thumbnail: string;
  year: number;
  categories: { name: string }[];
};

type Props = {
  projects: Project[];
  onDeleted: () => void;
};

export default function ProjectsTable({ projects, onDeleted }: Props) {
  async function remove(id: string, title: string) {
    if (!confirm(`Remove "${title}"? This can't be undone.`)) return;
    await fetch(`/api/projects/${id}`, { method: "DELETE" });
    onDeleted();
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
          <tr key={p.id}>
            <td>
              <div className="row-title">
                <div className="thumb-sm" style={{ backgroundImage: `url(${p.thumbnail})` }} />
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
                <button className="danger" onClick={() => remove(p.id, p.title)}>
                  Remove
                </button>
              </div>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
