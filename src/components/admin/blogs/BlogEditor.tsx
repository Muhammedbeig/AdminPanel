"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { 
  Save, Image as ImageIcon, Globe, FileText, ArrowLeft, 
  LayoutList, CheckCircle2, RotateCcw, Calendar, Copy, Trash2, Eye, Star,
  ChevronDown // ✅ Added ChevronDown
} from "lucide-react";
// ✅ IMPORT THE ADVANCED EDITOR
import RichTextEditor from "@/components/ui/RichTextEditor";

type EditorProps = {
  post?: any;
};

type FAQ = { question: string; answer: string };

const AUTO_SAVE_KEY = "blog_editor_draft_v1";

// ✅ Helper to clean verbose citation tags from DB data
const cleanName = (name: string) => {
  if (!name) return "";
  return name.replace(/\[cite_start\]/g, "").replace(/\[cite.*?\]/g, "").trim();
};

export default function BlogEditor({ post }: EditorProps) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [categories, setCategories] = useState<any[]>([]);
  
  // --- STATES ---
  const [lastSaved, setLastSaved] = useState<Date | null>(null);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);
  const [draftRestored, setDraftRestored] = useState(false);

  // ✅ FIX: Stable content state to prevent Editor cursor jumping
  const [editorInitialContent, setEditorInitialContent] = useState(post?.content || "");

  const [formData, setFormData] = useState({
    title: post?.title || "",
    slug: post?.slug || "",
    content: post?.content || "", 
    excerpt: post?.excerpt || "",
    categoryId: post?.categoryId || "",
    featuredImage: post?.featuredImage || "",
    metaTitle: post?.metaTitle || "",
    metaDescription: post?.metaDescription || "",
    keywords: post?.keywords || "",
    isIndexable: post?.isIndexable ?? true,
    isPublished: post?.isPublished || false,
    publishedAt: post?.publishedAt ? new Date(post.publishedAt).toISOString().slice(0, 16) : "", 
    isFeatured: post?.isFeatured || false,
  });

  const [faqs, setFaqs] = useState<FAQ[]>(post?.faqs || []);
  const [activeTab, setActiveTab] = useState<"content" | "seo" | "schema">("content");
  
  const wordCount = (formData.content || "").replace(/<[^>]*>/g, '').split(/\s+/g).filter(Boolean).length;
  const readingTime = Math.ceil(wordCount / 200);

  // --- 1. LOAD DRAFT ON MOUNT ---
  useEffect(() => {
    // Load Categories
    fetch("/api/admin/blogs/categories")
      .then(res => res.json())
      .then(data => { if(data.ok) setCategories(data.categories) });

    // Draft Logic
    if (!post) {
      const saved = localStorage.getItem(AUTO_SAVE_KEY);
      if (saved) {
        try {
          const parsed = JSON.parse(saved);
          if (parsed.formData.title || parsed.formData.content) {
            if (confirm("Found an unsaved draft from your last session. Restore it?")) {
              setFormData(parsed.formData);
              setFaqs(parsed.faqs);
              // ✅ FIX: Update the stable editor content only once on restore
              setEditorInitialContent(parsed.formData.content);
              setDraftRestored(true);
              setLastSaved(new Date());
            } else {
              localStorage.removeItem(AUTO_SAVE_KEY);
            }
          }
        } catch (e) {
          console.error("Failed to parse draft", e);
        }
      }
    }
  }, []);

  // --- 2. AUTO-SAVE TIMER ---
  useEffect(() => {
    if (!hasUnsavedChanges) return;
    const timer = setTimeout(() => {
      localStorage.setItem(AUTO_SAVE_KEY, JSON.stringify({ formData, faqs }));
      setLastSaved(new Date());
      setHasUnsavedChanges(false);
    }, 3000); 
    return () => clearTimeout(timer);
  }, [formData, faqs, hasUnsavedChanges]);

  const updateField = (field: string, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setHasUnsavedChanges(true);
  };

  const handleTitleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    const newSlug = !post ? val.toLowerCase().replace(/ /g, "-").replace(/[^\w-]+/g, "") : formData.slug;
    
    setFormData(prev => ({
      ...prev,
      title: val,
      slug: newSlug,
      metaTitle: !post ? val : prev.metaTitle,
    }));
    setHasUnsavedChanges(true);
  };

  // --- ACTIONS ---
  async function handleSave() {
    setLoading(true);
    const url = post ? `/api/admin/blogs/${post.id}` : "/api/admin/blogs";
    const method = post ? "PUT" : "POST";
    const payload = { 
      ...formData, 
      faqs,
      publishedAt: formData.publishedAt ? new Date(formData.publishedAt).toISOString() : null
    };

    try {
      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      
      if (data.ok) {
        localStorage.removeItem(AUTO_SAVE_KEY);
        alert(post ? "Saved successfully!" : "Post created!");
        if(!post) router.push(`/blogs/${data.post.id}`); 
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Save failed");
    } finally {
      setLoading(false);
    }
  }

  async function handleDuplicate() {
    if(!confirm("Create a copy of this post?")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}/duplicate`, { method: "POST" });
      const data = await res.json();
      if(data.ok) {
        alert("Post duplicated!");
        router.push("/blogs");
      }
    } catch(e) { alert("Failed to duplicate"); }
    setLoading(false);
  }

  async function handleDelete() {
    if(!confirm("Move this post to Trash? You can restore it later.")) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/blogs/${post.id}`, { method: "DELETE" });
      if(res.ok) {
        localStorage.removeItem(AUTO_SAVE_KEY);
        router.push("/blogs");
      }
    } catch(e) { alert("Failed to delete"); }
    setLoading(false);
  }

  const selectedCat = categories.find(c => c.id.toString() === formData.categoryId.toString());
  const categorySlug = selectedCat ? cleanName(selectedCat.slug) : "uncategorized";
  const previewUrl = `/blog/${categorySlug}/${formData.slug || "post-url"}`;

  const getTabClass = (tab: string) => {
    const isActive = activeTab === tab;
    if (isActive) {
      return "px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 bg-blue-50 text-blue-600 border-blue-600 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500";
    }
    return "px-4 py-3 text-sm font-bold border-b-2 transition-colors flex items-center gap-2 border-transparent text-secondary hover:text-primary hover:bg-slate-50 dark:hover:bg-white/5";
  };

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-6 animate-in fade-in duration-500">
      
      {/* --- TOP HEADER --- */}
      <div className="flex flex-col md:flex-row md:items-center justify-between sticky top-0 z-30 theme-bg py-4 border-b theme-border px-4 md:px-0 gap-4 md:gap-0 shadow-sm">
        <div className="flex items-center gap-4">
           <button onClick={() => router.back()} className="p-2 hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors">
             <ArrowLeft size={20} className="text-secondary" />
           </button>
           <div>
             <h1 className="text-xl font-black text-primary flex items-center gap-2">
               {post ? "Edit Post" : "New Post"}
               {draftRestored && (
                 <span className="text-[10px] bg-amber-100 text-amber-700 px-2 py-0.5 rounded-full flex items-center gap-1">
                   <RotateCcw size={10} /> Draft Restored
                 </span>
               )}
               <button 
                 onClick={() => updateField("isFeatured", !formData.isFeatured)}
                 className={`p-1 rounded-full transition-colors ${formData.isFeatured ? "text-amber-500 bg-amber-500/10" : "text-slate-300 hover:text-amber-500"}`}
                 title="Toggle Featured"
               >
                 <Star size={18} fill={formData.isFeatured ? "currentColor" : "none"} />
               </button>
             </h1>
             <div className="flex items-center gap-3 text-xs font-mono mt-1">
                <span className="px-2 py-0.5 rounded font-bold bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-500 border border-blue-200 dark:border-blue-900/30">
                  {wordCount} words
                </span>
                <span className="text-secondary opacity-50">•</span>
                <span className="text-secondary">{readingTime} min read</span>
                
                {lastSaved && (
                  <>
                    <span className="text-secondary opacity-50">•</span>
                    <span className="flex items-center gap-1 text-emerald-600 dark:text-emerald-400 font-bold transition-opacity duration-500">
                      <CheckCircle2 size={12} />
                      Saved {lastSaved.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </>
                )}
             </div>
           </div>
        </div>
        <div className="flex items-center gap-2">
          {post && (
            <>
               <button onClick={handleDuplicate} className="p-2 text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Duplicate">
                 <Copy size={18} />
               </button>
               <a href={previewUrl} target="_blank" rel="noreferrer" className="p-2 text-secondary hover:text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-500/10 rounded-lg transition-colors" title="Preview">
                 <Eye size={18} />
               </a>
               <button onClick={handleDelete} className="p-2 text-secondary hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors" title="Move to Trash">
                 <Trash2 size={18} />
               </button>
               <div className="w-px h-6 bg-slate-200 dark:bg-slate-700 mx-2"></div>
            </>
          )}

          <label className="hidden md:flex items-center gap-2 text-xs font-bold text-secondary cursor-pointer bg-slate-100 dark:bg-white/5 px-3 py-1.5 rounded-lg border theme-border hover:bg-slate-200 dark:hover:bg-white/10 transition-colors">
            <input 
              type="checkbox" 
              className="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
              checked={formData.isPublished}
              onChange={e => updateField("isPublished", e.target.checked)}
            />
            {formData.isPublished ? "Published" : "Draft"}
          </label>
          <button 
            onClick={handleSave}
            disabled={loading}
            className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            <Save size={16} /> {loading ? "Saving..." : (post ? "Update" : "Publish")}
          </button>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* --- LEFT COLUMN: EDITOR --- */}
        <div className="lg:col-span-2 space-y-6">
           
           <input 
             className="w-full text-4xl font-black bg-transparent border-none outline-none text-primary placeholder:text-slate-500 dark:placeholder:text-slate-500 transition-colors"
             placeholder="Article Title Here..."
             value={formData.title}
             onChange={handleTitleChange}
           />
           
           <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1 flex items-center gap-2 text-xs text-secondary font-mono theme-bg theme-border border rounded-lg px-3 py-2">
                <Globe size={12} />
                <span className="opacity-50 shrink-0">/blog/{selectedCat ? selectedCat.slug : "..."}/</span>
                <input 
                  className="bg-transparent outline-none text-blue-600 dark:text-blue-500 font-bold w-full"
                  value={formData.slug}
                  onChange={e => updateField("slug", e.target.value)}
                  placeholder="post-url-slug"
                />
              </div>
              
              {/* ✅ FIXED: Custom Dropdown Style with ChevronDown (Matches your request perfectly) */}
              <div className="relative w-full md:w-48 group">
                <select 
                  className="w-full appearance-none theme-bg theme-border border rounded-lg px-3 py-2 text-xs font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 cursor-pointer"
                  value={formData.categoryId}
                  onChange={e => updateField("categoryId", e.target.value)}
                >
                  <option value="">Uncategorized</option>
                  {categories.map(c => (
                    <option key={c.id} value={c.id}>
                      {cleanName(c.name)}
                    </option>
                  ))}
                </select>
                <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none group-hover:text-primary transition-colors" />
              </div>

           </div>

           {/* Tabs */}
           <div className="flex items-center gap-1">
             <button onClick={() => setActiveTab("content")} className={getTabClass("content")}>
               <FileText size={16} /> Write Story
             </button>
             <button onClick={() => setActiveTab("seo")} className={getTabClass("seo")}>
               <Globe size={16} /> SEO Settings
             </button>
             <button onClick={() => setActiveTab("schema")} className={getTabClass("schema")}>
               <LayoutList size={16} /> FAQ Schema
             </button>
           </div>

           {/* === TAB: CONTENT === */}
           {activeTab === "content" && (
             <div className="animate-in fade-in space-y-4">
                <RichTextEditor 
                  initialContent={editorInitialContent} 
                  onChange={(html) => updateField("content", html)}
                  height="h-[700px]" 
                />
             </div>
           )}

           {/* === TAB: SEO === */}
           {activeTab === "seo" && (
             <div className="space-y-8 animate-in fade-in">
                <div className="theme-bg theme-border border rounded-xl p-6">
                  <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-4">Google Search Result</h3>
                  <div className="bg-white p-4 rounded-lg border border-slate-200 max-w-xl shadow-sm">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center text-[10px]">⚽</div>
                      <div className="text-xs text-slate-700">yoursite.com › blog › {categorySlug} › {formData.slug || "post-url"}</div>
                    </div>
                    <div className="text-[#1a0dab] text-xl hover:underline cursor-pointer font-medium mb-1 truncate">
                      {formData.metaTitle || formData.title || "Your Blog Title"}
                    </div>
                    <div className="text-sm text-[#4d5156] line-clamp-2">
                      {formData.metaDescription || "This is how your post will look in Google search results."}
                    </div>
                  </div>
                </div>
                <div className="grid grid-cols-1 gap-6">
                  <div>
                    <label className="text-xs font-bold text-secondary block mb-1">Meta Title</label>
                    <input className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary placeholder:text-slate-500 dark:placeholder:text-slate-500" value={formData.metaTitle} onChange={e => updateField("metaTitle", e.target.value)} maxLength={60} />
                  </div>
                  <div>
                    <label className="text-xs font-bold text-secondary block mb-1">Meta Description</label>
                    <textarea className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary h-24 resize-none placeholder:text-slate-500 dark:placeholder:text-slate-500" value={formData.metaDescription} onChange={e => updateField("metaDescription", e.target.value)} maxLength={160} />
                  </div>
                </div>
             </div>
           )}

           {/* === TAB: SCHEMA === */}
           {activeTab === "schema" && (
             <div className="space-y-6 animate-in fade-in">
                <div className="bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/30 p-4 rounded-xl">
                   <h3 className="font-bold text-sm mb-1">FAQ Schema Generator</h3>
                   <p className="text-xs opacity-80">Add questions below to automatically generate JSON-LD FAQ schema.</p>
                </div>

                <div className="theme-bg theme-border border rounded-xl p-6">
                  {faqs.map((faq, i) => (
                    <div key={i} className="mb-4 p-4 rounded-lg bg-slate-50 dark:bg-white/5 border theme-border relative group">
                       <button onClick={() => { const newFaqs = faqs.filter((_, idx) => idx !== i); setFaqs(newFaqs); setHasUnsavedChanges(true); }} className="absolute top-2 right-2 text-red-400 hover:text-red-500 p-1">✕</button>
                       <input className="w-full bg-transparent border-b theme-border px-0 py-1 font-bold text-sm text-primary mb-2 outline-none placeholder:text-slate-500" placeholder="Question..." value={faq.question} onChange={e => { const newFaqs = [...faqs]; newFaqs[i].question = e.target.value; setFaqs(newFaqs); setHasUnsavedChanges(true); }} />
                       <textarea className="w-full bg-transparent border-none px-0 py-1 text-sm text-secondary h-16 resize-none outline-none placeholder:text-slate-500" placeholder="Answer..." value={faq.answer} onChange={e => { const newFaqs = [...faqs]; newFaqs[i].answer = e.target.value; setFaqs(newFaqs); setHasUnsavedChanges(true); }} />
                    </div>
                  ))}
                  <button onClick={() => setFaqs([...faqs, { question: "", answer: "" }])} className="w-full py-2 border-2 border-dashed theme-border rounded-lg text-xs font-bold text-secondary hover:text-blue-600 hover:border-blue-600 dark:hover:text-blue-500 dark:hover:border-blue-500 transition-colors">+ Add New Question</button>
                </div>
             </div>
           )}
        </div>

        {/* --- RIGHT: SETTINGS --- */}
        <div className="space-y-6">
          <div className="theme-bg theme-border border rounded-xl p-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3 flex items-center gap-2">
               <Calendar size={14} /> Schedule Publish
            </h3>
            <input type="datetime-local" className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary outline-none focus:ring-2 focus:ring-blue-500/50" value={formData.publishedAt} onChange={e => updateField("publishedAt", e.target.value)} />
            <p className="text-[10px] text-secondary mt-2 opacity-70">Leave empty to publish immediately.</p>
          </div>

          <div className="theme-bg theme-border border rounded-xl p-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">Featured Image</h3>
            <div className="aspect-video bg-slate-100 dark:bg-white/5 rounded-lg border-2 border-dashed theme-border flex items-center justify-center relative overflow-hidden group transition-all hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10">
              {formData.featuredImage ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={formData.featuredImage} alt="Cover" className="w-full h-full object-cover" />
              ) : (
                <div className="text-center p-4">
                  <ImageIcon className="text-secondary opacity-30 mx-auto mb-2 group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors" size={32} />
                  <p className="text-[10px] text-secondary group-hover:text-blue-600 dark:group-hover:text-blue-500 transition-colors">1200x630px</p>
                </div>
              )}
              <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                 <label className="cursor-pointer px-3 py-1 bg-white text-black text-xs font-bold rounded shadow-lg">
                   Change Image
                   <input type="file" className="hidden" accept="image/*" onChange={(e) => {
                      const file = e.target.files?.[0];
                      if(!file) return;
                      const fd = new FormData(); fd.append("file", file); fd.append("kind", "blog");
                      fetch("/api/admin/upload-file", {method:"POST", body:fd}).then(r=>r.json()).then(d=>d.ok && updateField("featuredImage", d.url));
                   }} />
                 </label>
              </div>
            </div>
          </div>

          <div className="theme-bg theme-border border rounded-xl p-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">Excerpt</h3>
            <textarea className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary outline-none h-32 resize-none placeholder:text-slate-500 dark:placeholder:text-slate-500" placeholder="Summary..." value={formData.excerpt} onChange={e => updateField("excerpt", e.target.value)} />
          </div>
          <div className="theme-bg theme-border border rounded-xl p-4">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest mb-3">Keywords</h3>
            <input className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary placeholder:text-slate-500 dark:placeholder:text-slate-500" placeholder="#football, #scores..." value={formData.keywords} onChange={e => updateField("keywords", e.target.value)} />
          </div>

        </div>
      </div>
    </div>
  );
}