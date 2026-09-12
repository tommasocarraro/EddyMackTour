"use client";

import { useState } from "react";

type Category = { id: string; name: string };

type Props = {
  categories: Category[];
  onAdded: () => void;
};

export default function CategoryPanel({ categories, onAdded }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);
  const [removingId, setRemovingId] = useState<string | null>(null);

  async function addCategory() {
    const name = value.trim();
    if (!name) return;
    setSaving(true);
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    setSaving(false);
    setValue("");
    onAdded();
  }

  async function removeCategory(id: string, name: string) {
    if (!confirm(`Remove "${name}"? It will be removed from every project that has it.`)) return;
    setRemovingId(id);
    await fetch(`/api/categories/${id}`, { method: "DELETE" });
    setRemovingId(null);
    onAdded();
  }

  return (
    <div className="cat-panel">
      <h3>Categories</h3>
      <div className="sub">
        Every project can belong to more than one category. Add a new one here when you need it — it&apos;ll
        show up as a filter on the site and as a checkbox when adding a project. Removing a category takes it
        off every project that has it.
      </div>
      <div className="cat-pills">
        {categories.map((c) => (
          <span className="pill removable" key={c.id}>
            {c.name}
            <button
              type="button"
              aria-label={`Remove ${c.name}`}
              onClick={() => removeCategory(c.id, c.name)}
              disabled={removingId === c.id}
            >
              ×
            </button>
          </span>
        ))}
      </div>
      <div className="cat-add">
        <input
          type="text"
          placeholder="e.g. Short Film"
          value={value}
          onChange={(e) => setValue(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && addCategory()}
        />
        <button className="btn" type="button" onClick={addCategory} disabled={saving}>
          Add category
        </button>
      </div>
    </div>
  );
}
