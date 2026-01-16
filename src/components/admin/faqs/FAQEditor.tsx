"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, Link as LinkIcon, Globe, ChevronDown } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function FAQEditor({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: initialData?.question || "",
    slug: initialData?.slug || "",
    answer: initialData?.answer || "",
    categoryId: initialData?.categoryId || "",
    isPublished: initialData?.isPublished ?? true,
  });
  const [mainSiteUrl, setMainSiteUrl] = useState<string>("");

  useEffect(() => {
    fetch("/api/admin/faqs/categories").then(r => r.json()).then(d => d.ok && setCategories(d.categories));
  }, []);

  useEffect(() => {
    fetch("/api/seo/global", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((j) => {
        const url = j?.data?.brand?.siteUrl;
        if (typeof url === "string" && url.trim()) {
          setMainSiteUrl(url);
        }
      })
      .catch(() => {});
  }, []);

  const slugify = (text: string) => 
    text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

  // Auto-update slug when question changes (only for new FAQs)
  const handleQuestionChange = (val: string) => {
    const shouldUpdate = !initialData && (formData.slug === "" || formData.slug === slugify(formData.question));
    setFormData(prev => ({
      ...prev,
      question: val,
      slug: shouldUpdate ? slugify(val) : prev.slug
    }));
  };

  const currentCat = categories.find(c => c.id.toString() === formData.categoryId.toString());
  const categorySlug = currentCat ? currentCat.slug : "uncategorized";
  const normalizeBaseUrl = (raw?: string) => {
    const s = String(raw || "").trim();
    if (!s) return "https://yoursite.com";
    return s.endsWith("/") ? s.slice(0, -1) : s;
  };
  const resolvedMainSiteUrl = normalizeBaseUrl(
    mainSiteUrl || process.env.NEXT_PUBLIC_MAINSITE_URL || ""
  );

  const handleSave = async () => {
    if (!formData.question || !formData.answer) return alert("Fill all fields");
    setLoading(true);
    
    const url = initialData ? `/api/admin/faqs/${initialData.id}` : "/api/admin/faqs";
    const method = initialData ? "PUT" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    if (res.ok) router.push("/faqs");
    setLoading(false);
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-center justify-between sticky top-0 z-30 theme-bg py-4 border-b theme-border">
        <div className="flex items-center gap-4">
          <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg text-secondary">
            <ArrowLeft size={20} />
          </button>
          <h1 className="text-xl font-black text-primary">{initialData ? "Edit Question" : "New Question"}</h1>
        </div>
        <div className="flex items-center gap-4">
          <label className="flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer select-none">
            <input 
              type="checkbox" 
              checked={formData.isPublished} 
              onChange={e => setFormData({...formData, isPublished: e.target.checked})} 
              className="w-4 h-4 rounded border-slate-300 text-blue-600 focus:ring-blue-500" 
            />
            Publish
          </label>
          <button 
            onClick={handleSave} 
            disabled={loading} 
            className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 flex items-center gap-2 transition-colors disabled:opacity-50"
          >
            <Save size={16} /> {loading ? "Saving..." : "Save FAQ"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          
          {/* Question Input */}
          <div>
            <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-2">Question</label>
            <input 
              className="w-full px-4 py-3 rounded-xl theme-bg border theme-border text-lg font-bold text-primary focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="e.g. How do I get a refund?"
              value={formData.question}
              onChange={e => handleQuestionChange(e.target.value)}
            />
          </div>

          {/* ✅ THEME-STYLED URL SETTINGS */}
          <div className="theme-bg theme-border border rounded-xl p-6">
            <label className="block text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
              <LinkIcon size={14} className="text-blue-500" /> URL Settings
            </label>
            
            <div className="flex items-center gap-0 w-full rounded-lg theme-border border overflow-hidden bg-white dark:bg-white/5">
              {/* ✅ UPDATED: Blue background and Blue text */}
              <div className="px-3 py-2 text-sm font-mono border-r theme-border select-none bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold">
                /faqs/{categorySlug}/
              </div>
              <input 
                className="flex-1 px-3 py-2 bg-transparent text-sm font-bold text-primary outline-none font-mono placeholder:text-slate-400 dark:placeholder:text-slate-600"
                placeholder="post-slug"
                value={formData.slug}
                onChange={e => setFormData({...formData, slug: slugify(e.target.value)})}
              />
            </div>
            
            <div className="mt-3 flex items-center gap-2 text-[11px] text-secondary">
              <Globe size={12} />
              <span className="opacity-70">Preview:</span>
              <a 
                href="#" 
                className="text-blue-600 dark:text-blue-400 hover:underline truncate"
              >
                {resolvedMainSiteUrl}/faqs/{categorySlug}/{formData.slug || "post-slug"}
              </a>
            </div>
          </div>
          
          {/* Answer Editor */}
          <div className="theme-bg theme-border border rounded-xl overflow-hidden min-h-[400px]">
             <RichTextEditor 
               initialContent={formData.answer} 
               onChange={html => setFormData({...formData, answer: html})}
               height="h-[500px]"
               placeholder="Write the answer here..."
             />
          </div>
        </div>

        {/* Sidebar Settings */}
        <div className="space-y-6">
          <div className="theme-bg theme-border border rounded-xl p-6">
            <h3 className="font-bold text-primary mb-4 text-sm flex items-center gap-2">
              Organization
            </h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-2">Category</label>
                <div className="relative">
                  <select 
                    className="w-full appearance-none px-3 py-2 rounded-lg theme-bg border theme-border text-sm text-primary font-medium outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                    value={formData.categoryId}
                    onChange={e => setFormData({...formData, categoryId: e.target.value})}
                  >
                    <option value="">Uncategorized</option>
                    {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                  <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
                </div>
                <p className="text-[10px] text-secondary mt-2 leading-relaxed">
                  Changing the category will automatically update the URL structure.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
