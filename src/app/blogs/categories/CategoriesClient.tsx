"use client";

import React, { useEffect, useState } from "react";
import { Layers, Plus, Trash2, Edit2, Check, X, CheckSquare, Square } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function CategoriesClient() {
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Create State
  const [newName, setNewName] = useState("");
  const [submitting, setSubmitting] = useState(false);
  
  // Edit State
  const [editingId, setEditingId] = useState<number | null>(null);
  const [editName, setEditName] = useState("");

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  async function load() {
    const res = await fetch("/api/admin/blogs/categories");
    const data = await res.json();
    if (data.ok) setCategories(data.categories);
    setLoading(false);
    setSelectedIds([]); // Reset selection on load
  }

  useEffect(() => { load(); }, []);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!newName.trim()) return;
    setSubmitting(true);
    
    const slug = newName.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "");
    
    await fetch("/api/admin/blogs/categories", { 
        method: "POST", 
        body: JSON.stringify({ name: newName, slug }) 
    });
    
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

  async function handleBulkDelete() {
    if (selectedIds.length === 0) return;
    if (!confirm(`Delete ${selectedIds.length} categories? Posts will be uncategorized.`)) return;

    await fetch(`/api/admin/blogs/categories`, { 
        method: "DELETE", 
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ids: selectedIds }) 
    });
    
    load();
  }

  // Selection Helpers
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === categories.length) setSelectedIds([]);
    else setSelectedIds(categories.map(c => c.id));
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER"]}>
      <div className="max-w-5xl space-y-8 animate-in fade-in">
        <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
          <div>
            <h1 className="text-2xl font-black text-primary flex items-center gap-2">
              <Layers className="text-blue-600" /> Categories
            </h1>
            <p className="text-sm text-secondary">Organize content sections.</p>
          </div>
          
          {/* Bulk Actions */}
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
            >
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
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
                  placeholder="e.g. News"
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
                  <th className="p-4 w-10">
                    <button onClick={toggleSelectAll} className="text-secondary hover:text-primary">
                      {selectedIds.length === categories.length && categories.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </th>
                  <th className="p-4">Name</th>
                  <th className="p-4">Slug</th>
                  <th className="p-4 text-center">Posts</th>
                  <th className="p-4 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {categories.map((c) => (
                   <tr key={c.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${selectedIds.includes(c.id) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                    <td className="p-4">
                      <button onClick={() => toggleSelect(c.id)} className={`text-secondary hover:text-primary ${selectedIds.includes(c.id) ? "text-blue-600" : ""}`}>
                        {selectedIds.includes(c.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                      </button>
                    </td>
                    <td className="p-4 font-bold text-primary">
                      {editingId === c.id ? (
                        <input 
                          autoFocus 
                          className="w-full px-3 py-1.5 rounded-lg bg-slate-100 dark:bg-white/10 border-2 border-blue-500 outline-none text-primary font-bold shadow-sm" 
                          value={editName} 
                          onChange={e => setEditName(e.target.value)} 
                        />
                      ) : c.name}
                     </td>
                    <td className="p-4 font-mono text-xs text-secondary opacity-70">
                      {editingId === c.id ? "..." : c.slug}
                    </td>
                    <td className="p-4 text-center text-xs font-bold text-secondary">
                      {c._count?.posts || 0}
                    </td>
                    <td className="p-4 text-right flex justify-end gap-2">
                      {editingId === c.id ? (
                         <>
                           <button onClick={() => handleUpdate(c.id)} className="p-1.5 text-emerald-500 hover:bg-emerald-50 rounded"><Check size={16}/></button>
                           <button onClick={() => setEditingId(null)} className="p-1.5 text-secondary hover:bg-slate-100 rounded"><X size={16}/></button>
                         </>
                      ) : (
                         <button onClick={() => { setEditingId(c.id); setEditName(c.name); }} className="p-1.5 text-blue-500 hover:bg-blue-50 rounded opacity-0 group-hover:opacity-100 transition-opacity"><Edit2 size={16}/></button>
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