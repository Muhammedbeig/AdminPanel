"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { 
  Plus, Search, Edit2, Trash2, HelpCircle, 
  CheckCircle2, XCircle, Tag
} from "lucide-react";

export default function FAQListClient() {
  const [faqs, setFaqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  const fetchFaqs = () => {
    setLoading(true);
    fetch(`/api/admin/faqs?q=${search}`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setFaqs(data.faqs);
        setLoading(false);
      });
  };

  useEffect(() => { fetchFaqs(); }, [search]);

  const handleDelete = async (id: number) => {
    if(!confirm("Delete this FAQ?")) return;
    await fetch("/api/admin/faqs", { 
      method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) 
    });
    fetchFaqs();
  };

  return (
    <div className="max-w-7xl mx-auto space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <HelpCircle className="text-blue-600" /> FAQ Manager
          </h1>
          <p className="text-sm text-secondary mt-1">Manage customer support questions.</p>
        </div>
        <div className="flex gap-2">
          <Link href="/faqs/categories" className="px-4 py-2 border theme-border bg-slate-50 dark:bg-white/5 text-primary rounded-lg font-bold text-sm hover:bg-slate-100 dark:hover:bg-white/10 transition-colors flex items-center gap-2">
            <Tag size={16} /> Categories
          </Link>
          <Link href="/faqs/new" className="px-4 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 transition-colors flex items-center gap-2">
            <Plus size={16} /> Add Question
          </Link>
        </div>
      </div>

      {/* Toolbar */}
      <div className="theme-bg theme-border border rounded-xl p-4 flex items-center gap-4">
        <div className="relative flex-1 max-w-md">
          <Search size={16} className="absolute left-3 top-2.5 text-secondary" />
          <input 
            className="w-full pl-9 pr-4 py-2 rounded-lg bg-slate-100 dark:bg-white/5 border border-transparent focus:border-blue-500 text-primary placeholder:text-secondary focus:ring-2 focus:ring-blue-500/20 outline-none text-sm font-medium transition-all"
            placeholder="Search questions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <table className="w-full text-left">
          <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase tracking-widest">
            <tr>
              <th className="p-4">Question</th>
              <th className="p-4">URL Slug</th>
              <th className="p-4">Category</th>
              <th className="p-4">Status</th>
              <th className="p-4 text-right">Actions</th>
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr><td colSpan={5} className="p-8 text-center text-secondary">Loading...</td></tr>
            ) : faqs.length === 0 ? (
              <tr><td colSpan={5} className="p-8 text-center text-secondary">No FAQs found.</td></tr>
            ) : (
              faqs.map(faq => (
                <tr key={faq.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-4 font-bold text-primary text-sm">{faq.question}</td>
                  
                  {/* ✅ URL Display Column */}
                  <td className="p-4">
                    <div className="flex items-center gap-1.5 text-xs font-mono text-secondary bg-slate-100 dark:bg-white/10 px-2 py-1 rounded w-fit">
                      <span className="opacity-50">/</span>
                      {faq.slug}
                    </div>
                  </td>

                  <td className="p-4">
                    {faq.category ? (
                      <span className="px-2 py-1 rounded-md bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-bold uppercase">
                        {faq.category.name}
                      </span>
                    ) : <span className="text-secondary text-xs">-</span>}
                  </td>
                  <td className="p-4">
                    {faq.isPublished ? (
                      <span className="flex items-center gap-1 text-emerald-500 text-xs font-bold"><CheckCircle2 size={14}/> Live</span>
                    ) : (
                      <span className="flex items-center gap-1 text-secondary text-xs font-bold"><XCircle size={14}/> Draft</span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <Link href={`/faqs/${faq.id}`} className="p-2 hover:bg-blue-50 dark:hover:bg-blue-500/20 text-blue-600 rounded-lg">
                        <Edit2 size={16} />
                      </Link>
                      <button onClick={() => handleDelete(faq.id)} className="p-2 hover:bg-red-50 dark:hover:bg-red-500/20 text-red-600 rounded-lg">
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}