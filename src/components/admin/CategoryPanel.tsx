"use client";

import { useState } from "react";
import type { StudioCategory } from "./types";

type Props = {
  categories: StudioCategory[];
  counts: Record<string, number>;
  onAdded: () => void;
};

export default function CategoryPanel({ categories, counts, onAdded }: Props) {
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
    <section className="studio-section">
      <div className="section-head">
        <h3>Categories</h3>
        <p>
          The filters visitors see in the site&apos;s menu. A project can have more than one; removing a
          category takes it off every project that has it.
        </p>
      </div>
      <div className="cat-manage">
        {categories.map((c) => (
          <span className="cat-chip" key={c.id}>
            {c.name}
            <span className="count">{counts[c.name] ?? 0}</span>
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
        <span className="cat-add">
          <input
            type="text"
            placeholder="New category, e.g. Short Film"
            aria-label="New category name"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button className="btn small" type="button" onClick={addCategory} disabled={saving || !value.trim()}>
            Add
          </button>
        </span>
      </div>
    </section>
  );
}
