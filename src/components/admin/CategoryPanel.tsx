"use client";

import { useState } from "react";

type Props = {
  categories: string[];
  onAdded: () => void;
};

export default function CategoryPanel({ categories, onAdded }: Props) {
  const [value, setValue] = useState("");
  const [saving, setSaving] = useState(false);

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

  return (
    <div className="cat-panel">
      <h3>Categories</h3>
      <div className="sub">
        Every project can belong to more than one category. Add a new one here when you need it — it&apos;ll
        show up as a filter on the site and as a checkbox when adding a project.
      </div>
      <div className="cat-pills">
        {categories.map((c) => (
          <span className="pill" key={c}>
            {c}
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
