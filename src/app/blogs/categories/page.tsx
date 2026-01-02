"use client";

import React, { useEffect, useState } from "react";
import { Layers, Plus, Trash2, Edit2, Check, X } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function CategoriesPage() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

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
    const slug = newName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    await fetch("/api/admin/blogs/categories", { method: "POST", body: JSON.stringify({ name: newName, slug }) });
    setNewName("");
    load();
    setSubmitting(false);
  }

  async function handleUpdate(id: number) {
    if(!editName.trim()) return;
    const slug = editName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    await fetch(`/api/admin/blogs/categories`, { 
        method: "PUT", 
        body: JSON.stringify({ id, name: editName, slug }) 
    });
    setEditingId(null);
    load();
  }

  async function handleDelete(id: number) {
    if(!confirm("Delete this category? Posts will be uncategorized.")) return;
    await fetch(`/api/admin/blogs/categories`, { 
        method: "DELETE", 
        body: JSON.stringify({ id }) 
    });
    load();
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
              <button disabled={submitting} className="w-full py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-colors disabled:opacity-50">
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
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                  <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                    <td className="p-4 font-bold text-primary">
                      {editingId === c.id ? (
                        // ✅ FIXED: Dynamic Background & Text Color
                        <input 
                          autoFocus 
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 border-2 border-blue-500 outline-none text-primary font-bold shadow-sm" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                        />
                      ) : c.name}
                    </td>
                    <td className="p-4 font-mono text-xs text-blue-500">
                      {editingId === c.id ? <span className="opacity-50">Auto-generated</span> : c.slug}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {editingId === c.id ? (
                         <>
                           <button onClick={() => handleUpdate(c.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 dark:hover:bg-emerald-500/10 rounded"><Check size={16}/></button>
                           <button onClick={() => setEditingId(null)} className="p-1.5 text-secondary hover:bg-slate-100 dark:hover:bg-white/10 rounded"><X size={16}/></button>
                         </>
                      ) : (
                         <>
                           <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="p-1.5 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
                           <button onClick={() => handleDelete(c.id)} className="p-1.5 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Trash2 size={16}/></button>
                         </>
                      )}
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