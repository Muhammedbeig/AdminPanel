"use client";

import React, { useEffect, useState } from "react";
import { Trash2, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function FAQCategoriesClient() {
  const [categories, setCategories] = useState<any[]>([]);
  const [newName, setNewName] = useState("");
  const [loading, setLoading] = useState(true);

  const fetchCats = () => {
    fetch("/api/admin/faqs/categories")
      .then(r => r.json())
      .then(d => { if(d.ok) setCategories(d.categories); setLoading(false); });
  };

  useEffect(() => { fetchCats(); }, []);

  const handleAdd = async () => {
    if(!newName) return;
    await fetch("/api/admin/faqs/categories", { 
      method: "POST", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ name: newName }) 
    });
    setNewName("");
    fetchCats();
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Delete category? FAQs in this category will be unassigned.")) return;
    await fetch("/api/admin/faqs/categories", { 
      method: "DELETE", headers:{"Content-Type":"application/json"}, body: JSON.stringify({ id }) 
    });
    fetchCats();
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in">
      <div className="flex items-center gap-4">
        <Link href="/faqs" className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-secondary"><ArrowLeft size={20} /></Link>
        <div>
          <h1 className="text-2xl font-black text-primary">FAQ Categories</h1>
          <p className="text-sm text-secondary">Organize support questions.</p>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Create Form */}
        <div className="theme-bg theme-border border rounded-xl p-6 h-fit">
          <h3 className="font-bold text-primary mb-4">Add New</h3>
          <div className="space-y-4">
            <div>
              <label className="text-xs font-bold text-secondary uppercase">Category Name</label>
              <input 
                className="w-full mt-1 px-3 py-2 rounded-lg theme-bg border theme-border focus:ring-2 focus:ring-blue-500/50 outline-none text-sm text-primary"
                value={newName}
                onChange={e => setNewName(e.target.value)}
                placeholder="e.g. Billing"
              />
            </div>
            <button onClick={handleAdd} disabled={!newName} className="w-full py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 disabled:opacity-50">
              Create Category
            </button>
          </div>
        </div>

        {/* List */}
        <div className="md:col-span-2 theme-bg theme-border border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase">
              <tr>
                <th className="p-4">Name</th>
                <th className="p-4">Slug</th>
                <th className="p-4">Count</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            {/* ✅ REMOVED 'divide-y theme-border' to remove lines between rows */}
            <tbody>
              {categories.map(c => (
                <tr key={c.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4 font-bold text-primary">{c.name}</td>
                  <td className="p-4 text-xs text-secondary font-mono">{c.slug}</td>
                  <td className="p-4 text-xs text-primary font-bold bg-slate-100 dark:bg-white/10 rounded w-fit px-2">{c._count.faqs} items</td>
                  <td className="p-4 text-right">
                    <button onClick={() => handleDelete(c.id)} className="text-red-500 hover:bg-red-50 dark:hover:bg-white/10 p-1.5 rounded"><Trash2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}