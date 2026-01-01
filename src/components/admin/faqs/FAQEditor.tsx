"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Save, ArrowLeft, CheckCircle2 } from "lucide-react";
import RichTextEditor from "@/components/ui/RichTextEditor";

export default function FAQEditor({ initialData }: { initialData?: any }) {
  const router = useRouter();
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    question: initialData?.question || "",
    answer: initialData?.answer || "",
    categoryId: initialData?.categoryId || "",
    isPublished: initialData?.isPublished ?? true,
  });

  useEffect(() => {
    fetch("/api/admin/faqs/categories").then(r => r.json()).then(d => d.ok && setCategories(d.categories));
  }, []);

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
          <label className="flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer">
            <input type="checkbox" checked={formData.isPublished} onChange={e => setFormData({...formData, isPublished: e.target.checked})} className="rounded text-blue-600 focus:ring-blue-500" />
            Publish
          </label>
          <button onClick={handleSave} disabled={loading} className="px-6 py-2 bg-blue-600 text-white rounded-lg font-bold text-sm hover:bg-blue-500 flex items-center gap-2">
            <Save size={16} /> {loading ? "Saving..." : "Save FAQ"}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <div>
            <label className="block text-xs font-bold text-secondary uppercase mb-2">Question</label>
            <input 
              className="w-full px-4 py-3 rounded-xl theme-bg border theme-border text-lg font-bold text-primary focus:ring-2 focus:ring-blue-500/50 outline-none placeholder:text-secondary/50"
              placeholder="e.g. How do I reset my password?"
              value={formData.question}
              onChange={e => setFormData({...formData, question: e.target.value})}
            />
          </div>
          
          <div className="theme-bg theme-border border rounded-xl overflow-hidden min-h-[400px]">
             <RichTextEditor 
               initialContent={formData.answer} 
               onChange={html => setFormData({...formData, answer: html})}
               height="h-[500px]"
               placeholder="Write the answer here..."
             />
          </div>
        </div>

        <div className="space-y-6">
          <div className="theme-bg theme-border border rounded-xl p-6">
            <h3 className="font-bold text-primary mb-4 text-sm">Settings</h3>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-bold text-secondary uppercase">Category</label>
                <select 
                  className="w-full mt-1 px-3 py-2 rounded-lg theme-bg border theme-border text-sm text-primary outline-none"
                  value={formData.categoryId}
                  onChange={e => setFormData({...formData, categoryId: e.target.value})}
                >
                  <option value="">Uncategorized</option>
                  {categories.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
                </select>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}