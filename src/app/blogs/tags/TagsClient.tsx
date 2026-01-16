"use client";

import React, { useEffect, useState } from "react";
import { Tags, Search, Plus, Edit3, Trash2, X, FileText, CheckSquare, Square } from "lucide-react";

interface Tag {
  id: number;
  name: string;
  slug: string;
  description?: string;
  _count: { posts: number };
}

export default function TagsClient() {
  const [tags, setTags] = useState<Tag[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  
  // Modal State
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTag, setEditingTag] = useState<Tag | null>(null);
  const [formData, setFormData] = useState({ name: "", slug: "", description: "" });
  const [saving, setSaving] = useState(false);

  // Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchTags = () => {
    setLoading(true);
    fetch(`/api/admin/blogs/tags?q=${search}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setTags(data.tags);
        setLoading(false);
        setSelectedIds([]);
      });
  };

  useEffect(() => { fetchTags(); }, [search]);

  // Handlers
  const handleSave = async () => {
    if (!formData.name) return alert("Name is required");
    setSaving(true);
    
    const method = editingTag ? "PUT" : "POST";
    const body = editingTag ? { ...formData, id: editingTag.id } : formData;

    const res = await fetch("/api/admin/blogs/tags", {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body)
    });

    const data = await res.json();
    setSaving(false);

    if (data.ok) {
      setIsModalOpen(false);
      fetchTags();
    } else {
      alert(data.error);
    }
  };

  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Are you sure you want to delete ${selectedIds.length} tags?`)) return;

    await fetch("/api/admin/blogs/tags", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds })
    });
    fetchTags();
  };

  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === tags.length) setSelectedIds([]);
    else setSelectedIds(tags.map(t => t.id));
  };

  const handleOpenModal = (tag?: Tag) => {
    if (tag) {
      setEditingTag(tag);
      setFormData({ name: tag.name, slug: tag.slug, description: tag.description || "" });
    } else {
      setEditingTag(null);
      setFormData({ name: "", slug: "", description: "" });
    }
    setIsModalOpen(true);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-20">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Tags className="text-blue-600" /> Tags
          </h1>
          <p className="text-sm text-secondary mt-1">
            Organize content with non-hierarchical topic labels.
          </p>
        </div>
        <div className="flex gap-3">
           {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
            >
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
           )}
           <button 
             onClick={() => handleOpenModal()}
             className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
           >
             <Plus size={16} /> New Tag
           </button>
        </div>
      </div>

      {/* Search Bar */}
      <div className="theme-bg theme-border border rounded-xl p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
          <input 
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500 text-primary outline-none text-sm font-medium transition-all"
            placeholder="Search tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* Tags List */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase tracking-widest">
            <tr>
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-secondary hover:text-primary">
                  {selectedIds.length === tags.length && tags.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </th>
              <th className="p-4 w-[30%]">Tag Name</th>
              <th className="p-4 w-[30%]">Slug</th>
              <th className="p-4 w-[20%] text-center">Usage</th>
              <th className="p-4 w-[20%] text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-secondary">Loading tags...</td></tr>
            ) : tags.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-secondary">No tags found.</td></tr>
            ) : (
              tags.map(tag => (
                <tr key={tag.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group ${selectedIds.includes(tag.id) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                  <td className="p-4">
                    <button onClick={() => toggleSelect(tag.id)} className={`text-secondary hover:text-primary ${selectedIds.includes(tag.id) ? "text-blue-600" : ""}`}>
                      {selectedIds.includes(tag.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                    </button>
                  </td>
                  <td className="p-4 font-bold text-primary">
                    {tag.name}
                    {tag.description && (
                      <div className="text-[10px] text-secondary font-normal truncate max-w-[200px] mt-0.5">
                        {tag.description}
                      </div>
                    )}
                  </td>
                  <td className="p-4 text-xs font-mono text-secondary">
                    <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded">
                      {tag.slug}
                    </span>
                  </td>
                  <td className="p-4 text-center">
                    <span className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-bold ${
                      tag._count.posts > 0 
                        ? "bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400" 
                        : "bg-slate-100 text-slate-500 dark:bg-white/10"
                    }`}>
                      <FileText size={12} /> {tag._count.posts}
                    </span>
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => handleOpenModal(tag)} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-blue-600 rounded-lg transition-colors">
                        <Edit3 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* --- CREATE / EDIT MODAL --- */}
      {isModalOpen && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-in fade-in">
          <div className="w-full max-w-md theme-bg theme-border border rounded-2xl shadow-2xl overflow-hidden animate-in zoom-in-95">
            <div className="p-4 border-b theme-border flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
              <h3 className="font-bold text-primary flex items-center gap-2">
                {editingTag ? <Edit3 size={18} /> : <Plus size={18} />}
                {editingTag ? "Edit Tag" : "Create New Tag"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="p-1 hover:bg-slate-200 dark:hover:bg-white/10 rounded-full transition-colors text-secondary">
                <X size={18} />
              </button>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase mb-1 block">Tag Name</label>
                <input 
                  autoFocus
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
                  placeholder="e.g. Champions League"
                  value={formData.name}
                  onChange={e => {
                    setFormData({ ...formData, name: e.target.value });
                  }}
                />
              </div>
              <div>
                <label className="text-xs font-bold text-secondary uppercase mb-1 block">Description (Optional)</label>
                <textarea 
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary outline-none focus:ring-2 focus:ring-blue-500/50 resize-none h-24"
                  value={formData.description}
                  onChange={e => setFormData({ ...formData, description: e.target.value })}
                />
              </div>
            </div>

            <div className="p-4 border-t theme-border bg-slate-50/50 dark:bg-white/5 flex justify-end gap-3">
              <button 
                onClick={() => setIsModalOpen(false)}
                className="px-4 py-2 text-sm font-bold text-secondary hover:text-primary transition-colors"
              >
                  Cancel
              </button>
              <button 
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 flex items-center gap-2"
              >
                {saving ? "Saving..." : "Save Tag"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}