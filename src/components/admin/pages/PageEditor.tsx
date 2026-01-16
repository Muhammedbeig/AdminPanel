"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Save, Globe, ArrowLeft, Trash2, Eye, Layout } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function PageEditor({ page }: { page?: any }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    title: page?.title || "",
    slug: page?.slug || "",
    content: page?.content || "",
    metaTitle: page?.metaTitle || "",
    metaDescription: page?.metaDescription || "",
    isPublished: page?.isPublished ?? false,
  });

  const slugify = (text: string) => 
    text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '');

  const handleSave = async () => {
    setLoading(true);
    const url = page ? `/api/admin/pages/${page.id}` : "/api/admin/pages";
    const method = page ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      alert("Page saved successfully!");
      if (!page) router.push(`/pages`);
    } else {
      alert(data.error);
    }
  };

  const handleDelete = async () => {
    if (!confirm("Permanently delete this page?")) return;
    await fetch(`/api/admin/pages/${page.id}`, { method: "DELETE" });
    router.push("/pages");
  };

  return (
    <div className="max-w-6xl mx-auto pb-20 space-y-6 animate-in fade-in">
      
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 theme-bg py-4 border-b theme-border">
        <div className="flex items-center gap-4">
          <button onClick={() => router.push("/pages")} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg">
            <ArrowLeft size={20} className="text-secondary" />
          </button>
          <h1 className="text-xl font-black text-primary">
            {page ? "Edit Page" : "New Page"}
          </h1>
        </div>
        <div className="flex items-center gap-3">
          {page && (
            <>
              <a href={`/${formData.slug}`} target="_blank" className="p-2 text-secondary hover:text-blue-600 rounded-lg">
                <Eye size={18} />
              </a>
              <button onClick={handleDelete} className="p-2 text-red-600 hover:bg-red-50 rounded-lg">
                <Trash2 size={18} />
              </button>
            </>
          )}
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2"
          >
            <Save size={16} /> {loading ? "Saving..." : "Save Page"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          <input 
            className="w-full text-4xl font-black bg-transparent border-none outline-none text-primary placeholder:text-slate-400"
            placeholder="Page Title (e.g. About Us)"
            value={formData.title}
            onChange={e => {
              const title = e.target.value;
              setFormData(prev => ({ 
                ...prev, 
                title, 
                slug: !page ? slugify(title) : prev.slug 
              }));
            }}
          />
          
          <div className="flex items-center gap-2 text-xs text-secondary font-mono theme-bg theme-border border rounded-lg px-3 py-2">
            <Globe size={12} />
            <span className="opacity-50">yoursite.com/</span>
            <input 
              className="bg-transparent outline-none text-blue-600 font-bold w-full"
              value={formData.slug}
              onChange={e => setFormData({ ...formData, slug: slugify(e.target.value) })}
            />
          </div>

          <RichTextEditor 
            initialContent={formData.content} 
            onChange={(html) => setFormData({ ...formData, content: html })}
            height="h-[600px]"
          />
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          
          {/* Status */}
          <div className="theme-bg theme-border border rounded-xl p-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
              <Layout size={14} /> Publishing
            </h3>
            <label className="flex items-center gap-2 cursor-pointer">
              <input 
                type="checkbox" 
                className="w-4 h-4 text-blue-600 rounded"
                checked={formData.isPublished}
                onChange={e => setFormData({ ...formData, isPublished: e.target.checked })}
              />
              <span className="text-sm font-bold text-primary">
                {formData.isPublished ? "Live (Public)" : "Draft (Hidden)"}
              </span>
            </label>
          </div>

          {/* SEO */}
          <div className="theme-bg theme-border border rounded-xl p-4 space-y-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest flex items-center gap-2">
              <Globe size={14} /> SEO Metadata
            </h3>
            
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Meta Title</label>
              <input 
                className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary"
                value={formData.metaTitle}
                onChange={e => setFormData({ ...formData, metaTitle: e.target.value })}
                placeholder={formData.title}
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Meta Description</label>
              <textarea 
                className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary h-24 resize-none"
                value={formData.metaDescription}
                onChange={e => setFormData({ ...formData, metaDescription: e.target.value })}
                placeholder="Brief summary for Google..."
              />
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}