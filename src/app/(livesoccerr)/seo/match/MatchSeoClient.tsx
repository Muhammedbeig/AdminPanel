"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type SaveState = { kind: "idle" | "loading" | "saving" | "saved" | "error"; message?: string };

// Matches your JSON structure
type SeoMatchDoc = {
  labels?: {
    matchTabLabels?: Record<string, string>;
  };
  match?: {
    revalidateSeconds?: number;
    apiTimeoutMs?: number;
    primaryKeyword?: string;
    titlePatterns?: string[];
    descriptionPattern?: string;
    h1Pattern?: string;
    og?: {
      useDynamicBanner?: boolean;
      bannerPath?: string;
      fallbackImage?: string;
    };
    schema?: {
      enabled?: boolean;
    };
  };
};

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v));
}

function setPath(obj: any, path: string, value: any) {
  const parts = path.split(".");
  const next = deepClone(obj);
  let cur = next;
  for (let i = 0; i < parts.length - 1; i++) {
    const k = parts[i];
    cur[k] = cur[k] ?? {};
    cur = cur[k];
  }
  cur[parts[parts.length - 1]] = value;
  return next;
}

function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-bg theme-border border rounded-xl p-6">
      <div className="text-lg font-black text-primary">{title}</div>
      {description ? <div className="text-sm text-secondary mt-1">{description}</div> : null}
      <div className="mt-5">{children}</div>
    </div>
  );
}

export default function MatchSeoClient() {
  const router = useRouter();
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  const { user, loading } = useAdminAuth();

  const [data, setData] = useState<SeoMatchDoc | null>(null);
  const [base, setBase] = useState<SeoMatchDoc | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });
  const [uploading, setUploading] = useState(false);

  const inputClass =
    "w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary outline-none focus:ring-2 focus:ring-blue-500/40";

  const dirty = useMemo(() => {
    if (!data || !base) return false;
    return JSON.stringify(data) !== JSON.stringify(base);
  }, [data, base]);

  const canEdit = BYPASS || !!user;

  async function load() {
    setSaveState({ kind: "loading" });
    try {
      if (!BYPASS && !user) return; 

      const res = await fetch("/api/seo/match", { method: "GET" });
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/match")}`);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");

      const json = await res.json();
      const doc = json.data;
      
      setData(doc);
      setBase(deepClone(doc));
      setSaveState({ kind: "idle" });
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Error loading data" });
    }
  }

  async function save() {
    if (!data) return;
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch("/api/seo/match", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (!res.ok) throw new Error("Failed to save");

      setBase(deepClone(data));
      setSaveState({ kind: "saved", message: "Settings saved." });
      setTimeout(() => setSaveState({ kind: "idle" }), 2000);
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Error saving" });
    }
  }

  // ✅ NEW: Handle Image Upload Logic
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);

    try {
      // TODO: Replace this with your actual API upload call
      // Example:
      // const formData = new FormData();
      // formData.append("file", file);
      // const res = await fetch("/api/upload", { method: "POST", body: formData });
      // const json = await res.json();
      // set("match.og.fallbackImage", json.url);
      
      console.log("File selected:", file.name);
      alert("File selected! To actually upload, please connect your /api/upload endpoint in MatchSeoClient.tsx");
      
    } catch (err) {
      console.error("Upload failed", err);
      alert("Upload failed");
    } finally {
      setUploading(false);
    }
  }

  useEffect(() => {
    if (!loading && (user || BYPASS)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const set = (path: string, value: any) => setData((prev: any) => setPath(prev, path, value));

  if (loading || (saveState.kind === "loading" && !data)) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading match settings...</div>
      </div>
    );
  }

  if (!data) return null;

  const m = data.match || {};
  const labels = data.labels?.matchTabLabels || {};

  return (
    <div className="space-y-4">
      {/* Header Actions */}
      <div className="theme-bg theme-border border rounded-xl p-5 flex items-center justify-between sticky top-4 z-30 shadow-sm">
        <div>
          <div className="text-lg font-black text-primary">Match SEO</div>
          <div className="text-xs text-secondary">Manage patterns for match detail pages.</div>
        </div>
        <div className="flex gap-2">
          <button
            onClick={load}
            disabled={!dirty || saveState.kind === "saving"}
            className="px-4 py-2 font-bold text-secondary hover:text-primary"
          >
            Reset
          </button>
          <button
            onClick={save}
            disabled={!dirty || saveState.kind === "saving" || !canEdit}
            className="bg-[#0f80da] text-white px-6 py-2 rounded-xl font-bold disabled:opacity-50"
          >
            {saveState.kind === "saving" ? "Saving..." : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {saveState.kind === "error" && (
        <div className="p-4 bg-red-500/10 border border-red-500/20 text-red-500 rounded-xl text-sm font-bold">
          {saveState.message}
        </div>
      )}

      {/* Config */}
      <Section title="Configuration" description="Technical settings for match pages.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">Revalidate (Seconds)</label>
            <input
              type="number"
              className={inputClass}
              value={m.revalidateSeconds ?? 60}
              onChange={(e) => set("match.revalidateSeconds", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary uppercase">API Timeout (ms)</label>
            <input
              type="number"
              className={inputClass}
              value={m.apiTimeoutMs ?? 650}
              onChange={(e) => set("match.apiTimeoutMs", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary uppercase">Primary Keyword</label>
            <input
              className={inputClass}
              value={m.primaryKeyword ?? ""}
              onChange={(e) => set("match.primaryKeyword", e.target.value)}
            />
          </div>
          <div className="flex items-center gap-3">
             <div className="flex items-center gap-2 mt-6">
                <input 
                  type="checkbox" 
                  checked={m.schema?.enabled ?? true}
                  onChange={(e) => set("match.schema.enabled", e.target.checked)}
                  className="w-5 h-5 accent-[#0f80da]"
                />
                <span className="text-sm font-bold text-primary">Enable JSON-LD Schema</span>
             </div>
          </div>
        </div>
      </Section>

      {/* Patterns */}
      <Section title="SEO Patterns" description="Variables: {home}, {away}, {brand}, {sport}, {league}">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">H1 Pattern</label>
            <input
              className={inputClass}
              value={m.h1Pattern ?? ""}
              onChange={(e) => set("match.h1Pattern", e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-black text-secondary uppercase">Description Pattern</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={m.descriptionPattern ?? ""}
              onChange={(e) => set("match.descriptionPattern", e.target.value)}
            />
          </div>

          <div>
             <label className="text-xs font-black text-secondary uppercase mb-2 block">Title Tag Patterns (Array)</label>
             <div className="space-y-2">
                {(m.titlePatterns || []).map((pat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      className={inputClass}
                      value={pat}
                      onChange={(e) => {
                        const copy = [...(m.titlePatterns || [])];
                        copy[idx] = e.target.value;
                        set("match.titlePatterns", copy);
                      }}
                    />
                    <button 
                      onClick={() => {
                         const copy = [...(m.titlePatterns || [])];
                         copy.splice(idx, 1);
                         set("match.titlePatterns", copy);
                      }}
                      className="text-red-500 font-bold px-2 hover:bg-red-500/10 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => set("match.titlePatterns", [...(m.titlePatterns || []), "New Pattern"])}
                  className="text-xs font-bold text-[#0f80da] uppercase tracking-wider hover:underline"
                >
                  + Add Pattern
                </button>
             </div>
          </div>
        </div>
      </Section>

      {/* Tab Labels */}
      <Section title="Tab Translations / Labels" description="Customize the text shown on match tabs.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {Object.entries(labels).map(([key, val]) => (
            <div key={key}>
              <label className="text-xs font-black text-secondary uppercase">{key}</label>
              <input
                className={inputClass}
                value={val as string}
                onChange={(e) => set(`labels.matchTabLabels.${key}`, e.target.value)}
              />
            </div>
          ))}
        </div>
      </Section>

      {/* OG Settings with UPLOAD BUTTON */}
      <Section title="Open Graph (Social)" description="Dynamic banner generation settings.">
         <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-black text-secondary uppercase">Banner Path Pattern</label>
              <input
                className={inputClass}
                value={m.og?.bannerPath ?? ""}
                onChange={(e) => set("match.og.bannerPath", e.target.value)}
              />
            </div>
            
            {/* Fallback Image with Upload Button */}
             <div>
              <label className="text-xs font-black text-secondary uppercase">Fallback Image</label>
              <div className="flex gap-2">
                <input
                  className={inputClass}
                  value={m.og?.fallbackImage ?? ""}
                  onChange={(e) => set("match.og.fallbackImage", e.target.value)}
                  placeholder="https://..."
                />
                <label className={`
                  flex items-center justify-center px-4 rounded-2xl cursor-pointer font-bold text-sm
                  transition-all active:scale-95
                  ${uploading ? 'bg-gray-100 text-gray-400' : 'bg-[#0f80da]/10 text-[#0f80da] hover:bg-[#0f80da]/20'}
                `}>
                  {uploading ? '...' : 'Upload'}
                  <input 
                    type="file" 
                    className="hidden" 
                    accept="image/*"
                    onChange={handleImageUpload}
                    disabled={uploading}
                  />
                </label>
              </div>
            </div>

            <div className="flex items-center gap-2 mt-2 md:col-span-2">
                <input 
                  type="checkbox" 
                  checked={m.og?.useDynamicBanner ?? true}
                  onChange={(e) => set("match.og.useDynamicBanner", e.target.checked)}
                  className="w-5 h-5 accent-[#0f80da]"
                />
                <span className="text-sm font-bold text-primary">Use Dynamic Banner Generation</span>
             </div>
         </div>
      </Section>
      
       {/* JSON View */}
      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}