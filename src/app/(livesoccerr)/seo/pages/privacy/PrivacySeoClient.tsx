"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type Block = { type: "p" | "ul" | "h3"; text?: string; items?: string[] };
type Section = { title: string; blocks: Block[] };

type PageDoc = {
  slug?: string;
  seo?: {
    title?: string;
    description?: string;
    h1?: string;
    primaryKeyword?: string;
    canonical?: string;
  };
  content?: {
    h1?: string;
    lastUpdated?: string;
    sections?: Section[];
  };
};

export default function PrivacySeoClient() {
  const router = useRouter();
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  const { user, loading } = useAdminAuth();

  const [data, setData] = useState<PageDoc | null>(null);
  const [status, setStatus] = useState("idle");

  const inputClass = "w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-blue-500/40";

  async function load() {
  setStatus("loading");
  try {
    const res = await fetch("/api/seo/pages/privacy-policy", { cache: "no-store" });
    if (res.status === 401) return router.push("/login");
    const json = await res.json();
    if (json.ok) setData(json.data);
    setStatus("idle");
  } catch (e) {
    console.error(e);
    setStatus("error");
  }
}

async function save() {
  setStatus("saving");
  try {
    await fetch("/api/seo/pages/privacy-policy", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ data }),
    });
    setStatus("saved");
    setTimeout(() => setStatus("idle"), 2000);
  } catch (e) {
    console.error(e);
    setStatus("error");
  }
}

  useEffect(() => {
    if (!loading && (user || BYPASS)) load();
  }, [loading, user]);

  if (loading || !data) return <div className="p-6">Loading Privacy Policy...</div>;

  const seo = data.seo || {};
  const content = data.content || {};

  const updateSeo = (k: string, v: any) => setData({ ...data, seo: { ...seo, [k]: v } });
  const updateContent = (k: string, v: any) => setData({ ...data, content: { ...content, [k]: v } });

  const updateSectionTitle = (idx: number, val: string) => {
    const newSections = [...(content.sections || [])];
    newSections[idx] = { ...newSections[idx], title: val };
    updateContent("sections", newSections);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="theme-bg theme-border border rounded-xl p-5 flex justify-between items-center sticky top-4 z-30 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-primary">Privacy Policy</h1>
          <p className="text-xs text-secondary">Manage SEO and Content for the Privacy Policy.</p>
        </div>
        <button
          onClick={save}
          disabled={status === "saving"}
          className="bg-[#0f80da] text-white px-6 py-2 rounded-xl font-bold"
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* 1. SEO Settings */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h2 className="text-lg font-black text-primary mb-4">SEO Metadata</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">Page Title</label>
            <input className={inputClass} value={seo.title || ""} onChange={e => updateSeo("title", e.target.value)} />
          </div>
          <div>
            <label className="text-xs font-black text-secondary uppercase">Primary Keyword</label>
            <input className={inputClass} value={seo.primaryKeyword || ""} onChange={e => updateSeo("primaryKeyword", e.target.value)} />
          </div>
          <div className="md:col-span-2">
            <label className="text-xs font-black text-secondary uppercase">Meta Description</label>
            <textarea className={inputClass} rows={2} value={seo.description || ""} onChange={e => updateSeo("description", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 2. Content Sections */}
      <div className="space-y-4">
        <h3 className="text-md font-bold text-secondary px-2">Sections</h3>
        {content.sections?.map((section, sIdx) => (
          <div key={sIdx} className="theme-bg theme-border border rounded-xl p-6">
             <div className="flex gap-2 mb-4">
                <input 
                  className={`${inputClass} font-bold`} 
                  value={section.title} 
                  onChange={(e) => updateSectionTitle(sIdx, e.target.value)}
                  placeholder="Section Title"
                />
                <button 
                  onClick={() => {
                    const copy = [...(content.sections || [])];
                    copy.splice(sIdx, 1);
                    updateContent("sections", copy);
                  }}
                  className="text-red-500 font-bold px-3"
                >
                  Delete
                </button>
             </div>

             <div className="space-y-3 pl-4 border-l-2 border-gray-100">
               {section.blocks.map((block, bIdx) => (
                 <div key={bIdx}>
                   <label className="text-[10px] text-secondary uppercase font-bold mb-1 block">
                      {block.type === "h3" ? "Subheading" : block.type === "ul" ? "List" : "Paragraph"}
                   </label>
                   {(block.type === "p" || block.type === "h3") && (
                     <textarea 
                        className={`${inputClass} ${block.type === "h3" ? "h-12 font-bold" : "min-h-[80px]"}`}
                        value={block.text || ""}
                        onChange={(e) => {
                          const newSections = [...(content.sections || [])];
                          newSections[sIdx].blocks[bIdx].text = e.target.value;
                          updateContent("sections", newSections);
                        }}
                     />
                   )}
                 </div>
               ))}
             </div>
          </div>
        ))}
        
        <button
          onClick={() => {
            const newSections = [...(content.sections || []), { title: "New Section", blocks: [{ type: "p", text: "New text..." }] }];
            updateContent("sections", newSections);
          }}
          className="w-full py-3 border-2 border-dashed border-gray-300 rounded-xl text-gray-400 font-bold hover:border-[#0f80da] hover:text-[#0f80da]"
        >
          + Add New Section
        </button>
      </div>
      
       {/* JSON Preview */}
      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}