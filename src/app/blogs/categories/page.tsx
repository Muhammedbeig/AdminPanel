"use client";

import React, { useEffect, useState } from "react";
import { Layers, Plus, Trash2 } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);

  async function load() {
    const res = await fetch("/api/admin/blogs/categories");
    const data = await res.json();
    if (data.ok) setCategories(data.categories);
    setLoading(false);
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);

    // Auto-generate slug from name
    const slug = newName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");

    try {
      const res = await fetch("/api/admin/blogs/categories", {
        method: "POST",
        body: JSON.stringify({ name: newName, slug }),
      });
      if (res.ok) {
        setNewName("");
        load();
      } else {
        alert("Error creating category");
      }
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER"]}>
      <div className="max-w-4xl space-y-8">
        <div>
          <h1 className="text-2xl font-black text-primary">Blog Categories</h1>
          <p className="text-sm text-secondary">Organize your content into sections.</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          
          {/* Create Form */}
          <div className="theme-bg theme-border border rounded-xl p-6 h-fit">
            <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
              <Plus size={18} className="text-blue-500" /> Create New
            </h3>
            <form onSubmit={handleAdd} className="space-y-4">
              <div>
                <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">Name</label>
                <input 
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Match Previews"
                  value={newName}
                  onChange={e => setNewName(e.target.value)}
                />
              </div>
              <button 
                disabled={submitting}
                className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50"
              >
                {submitting ? "Saving..." : "Add Category"}
              </button>
            </form>
          </div>

          {/* List */}
          <div className="md:col-span-2 theme-bg theme-border border rounded-xl overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-slate-50/50 dark:bg-white/5 text-xs font-black text-secondary uppercase tracking-widest border-b theme-border">
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4 text-right">Posts</th>
                </tr>
              </thead>
              {/* ✅ REMOVED 'divide-y theme-border' to remove lines between rows */}
              <tbody>
                {loading ? (
                  <tr><td colSpan={3} className="p-8 text-center text-secondary">Loading...</td></tr>
                ) : categories.length === 0 ? (
                  <tr><td colSpan={3} className="p-8 text-center text-secondary">No categories found.</td></tr>
                ) : categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-bold text-primary">{c.name}</td>
                    <td className="p-4 font-mono text-xs text-blue-500">{c.slug}</td>
                    <td className="p-4 text-right font-mono text-xs text-secondary">
                      {c._count?.posts || 0}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

        </div>
      </div>
    </RoleGuard>
  );
}