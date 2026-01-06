"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Globe, FileText, AlertTriangle, Trash2, CheckSquare, Square } from "lucide-react";

export default function PagesListClient() {
  const [pages, setPages] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  
  // ✅ Selection State
  const [selectedIds, setSelectedIds] = useState<number[]>([]);

  const fetchPages = () => {
    setLoading(true);
    fetch("/api/admin/pages")
      .then(async (r) => {
        if (r.status === 404) throw new Error("API Route not found.");
        if (!r.ok) throw new Error("Failed to load data");
        return r.json();
      })
      .then(d => {
        if (d.ok) {
          setPages(d.pages);
          setSelectedIds([]); // Reset selection on reload
        } else {
          setError(d.error);
        }
      })
      .catch(err => setError(err.message))
      .finally(() => setLoading(false));
  };

  useEffect(() => { fetchPages(); }, []);

  // ✅ Selection Logic
  const toggleSelect = (id: number) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(i => i !== id) : [...prev, id]);
  };

  const toggleSelectAll = () => {
    if (selectedIds.length === pages.length) setSelectedIds([]);
    else setSelectedIds(pages.map(p => p.id));
  };

  // ✅ Bulk Delete Logic
  const handleBulkDelete = async () => {
    if (selectedIds.length === 0) return;
    if (!confirm(`Permanently delete ${selectedIds.length} pages? This cannot be undone.`)) return;

    await fetch("/api/admin/pages", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ids: selectedIds })
    });
    
    fetchPages();
  };

  if (loading && pages.length === 0) return <div className="p-12 text-center text-secondary">Loading pages...</div>;
  
  if (error) return (
    <div className="p-12 text-center flex flex-col items-center text-red-500">
      <AlertTriangle size={32} className="mb-2" />
      <h3 className="font-bold">Error</h3>
      <p>{error}</p>
    </div>
  );

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-20">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-2xl font-black text-primary">Web Pages</h1>
          <p className="text-sm text-secondary">Manage static pages like About, Contact, Terms.</p>
        </div>
        <div className="flex items-center gap-3">
          {/* ✅ Bulk Delete Button */}
          {selectedIds.length > 0 && (
            <button 
              onClick={handleBulkDelete}
              className="px-4 py-2 bg-red-600 hover:bg-red-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-red-500/20"
            >
              <Trash2 size={16} /> Delete ({selectedIds.length})
            </button>
          )}
          <Link href="/pages/new" className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20">
            <Plus size={16} /> Create Page
          </Link>
        </div>
      </div>

      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-white/5 text-xs font-black text-secondary uppercase border-b theme-border">
            <tr>
              <th className="p-4 w-10">
                <button onClick={toggleSelectAll} className="text-secondary hover:text-primary">
                  {selectedIds.length === pages.length && pages.length > 0 ? <CheckSquare size={18} /> : <Square size={18} />}
                </button>
              </th>
              <th className="p-4">Title</th>
              <th className="p-4">URL Slug</th>
              <th className="p-4 text-center">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {pages.length === 0 ? (
               <tr><td colSpan={5} className="p-8 text-center text-secondary">No pages created yet.</td></tr>
            ) : pages.map(page => (
              <tr key={page.id} className={`hover:bg-slate-50 dark:hover:bg-white/5 border-b theme-border last:border-0 transition-colors ${selectedIds.includes(page.id) ? "bg-blue-50 dark:bg-blue-500/10" : ""}`}>
                <td className="p-4">
                  <button onClick={() => toggleSelect(page.id)} className={`text-secondary hover:text-primary ${selectedIds.includes(page.id) ? "text-blue-600" : ""}`}>
                    {selectedIds.includes(page.id) ? <CheckSquare size={18} /> : <Square size={18} />}
                  </button>
                </td>
                <td className="p-4 font-bold text-primary flex items-center gap-2">
                  <FileText size={16} className="text-blue-500" /> {page.title}
                </td>
                <td className="p-4 text-xs font-mono text-secondary">/{page.slug}</td>
                <td className="p-4 text-center">
                  <span className={`px-2 py-1 rounded text-[10px] font-bold uppercase ${page.isPublished ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                    {page.isPublished ? "Published" : "Draft"}
                  </span>
                </td>
                <td className="p-4 text-right flex justify-end gap-2">
                  <a href={`/${page.slug}`} target="_blank" className="p-2 text-secondary hover:text-blue-600"><Globe size={16}/></a>
                  <Link href={`/pages/${page.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded"><Edit3 size={16}/></Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}