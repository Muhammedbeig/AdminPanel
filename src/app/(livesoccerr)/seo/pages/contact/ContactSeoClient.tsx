"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type PageDoc = {
  seo?: any;
  content?: {
    h1?: string;
    lastUpdated?: string;
    intro?: string[];
    contactDetails?: {
      supportEmail?: string;
      phone?: string;
      whatsapp?: string;
      supportHours?: string;
    };
    sections?: any[];
  };
};

export default function ContactSeoClient() {
  const router = useRouter();
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  const { user, loading } = useAdminAuth();

  const [data, setData] = useState<PageDoc | null>(null);
  const [status, setStatus] = useState("idle");

  const inputClass = "w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-blue-500/40";

  async function load() {
    setStatus("loading");
    try {
      const res = await fetch("/api/seo/pages/contact");
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
      await fetch("/api/seo/pages/contact", {
        method: "POST",
        body: JSON.stringify({ data }),
      });
      setStatus("saved");
      setTimeout(() => setStatus("idle"), 2000);
    } catch (e) {
      setStatus("error");
    }
  }

  useEffect(() => {
    if (!loading && (user || BYPASS)) load();
  }, [loading, user]);

  if (loading || !data) return <div className="p-6">Loading Contact Page...</div>;

  const content = data.content || {};
  const details = content.contactDetails || {};
  
  const updateContent = (k: string, v: any) => setData({ ...data, content: { ...content, [k]: v } });
  const updateDetails = (k: string, v: any) => setData({ ...data, content: { ...content, contactDetails: { ...details, [k]: v } } });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="theme-bg theme-border border rounded-xl p-5 flex justify-between items-center sticky top-4 z-30 shadow-sm">
        <div>
          <h1 className="text-lg font-black text-primary">Contact Page</h1>
          <p className="text-xs text-secondary">Manage contact details and support info.</p>
        </div>
        <button
          onClick={save}
          disabled={status === "saving"}
          className="bg-[#0f80da] text-white px-6 py-2 rounded-xl font-bold"
        >
          {status === "saving" ? "Saving..." : status === "saved" ? "Saved!" : "Save Changes"}
        </button>
      </div>

      {/* 1. Contact Details (Specific to this page) */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h2 className="text-lg font-black text-primary mb-4">Contact Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">Support Email</label>
            <input className={inputClass} value={details.supportEmail || ""} onChange={e => updateDetails("supportEmail", e.target.value)} />
          </div>
          <div>
             <label className="text-xs font-black text-secondary uppercase">WhatsApp / Phone</label>
             <input className={inputClass} value={details.whatsapp || ""} onChange={e => updateDetails("whatsapp", e.target.value)} />
          </div>
          <div>
             <label className="text-xs font-black text-secondary uppercase">Support Hours</label>
             <input className={inputClass} value={details.supportHours || ""} onChange={e => updateDetails("supportHours", e.target.value)} />
          </div>
        </div>
      </div>

      {/* 2. Intro Text Array */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h2 className="text-lg font-black text-primary mb-4">Intro Paragraphs</h2>
        <div className="space-y-3">
          {(content.intro || []).map((text, idx) => (
            <textarea
              key={idx}
              className={`${inputClass} min-h-[60px]`}
              value={text}
              onChange={(e) => {
                const newIntro = [...(content.intro || [])];
                newIntro[idx] = e.target.value;
                updateContent("intro", newIntro);
              }}
            />
          ))}
          <button 
            onClick={() => updateContent("intro", [...(content.intro || []), "New paragraph"])}
            className="text-xs font-bold text-[#0f80da] uppercase"
          >
            + Add Paragraph
          </button>
        </div>
      </div>
      
       {/* JSON Preview */}
      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}