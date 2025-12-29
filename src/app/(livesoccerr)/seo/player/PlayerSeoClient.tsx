"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type SaveState = { kind: "idle" | "loading" | "saving" | "saved" | "error"; message?: string };

// Matches your Player JSON structure
type SeoPlayerDoc = {
  player?: {
    revalidateSeconds?: number;
    apiTimeoutMs?: number;
    primaryKeyword?: string;
    titlePatterns?: string[];
    descriptionPattern?: string;
    h1Pattern?: string;
    og?: {
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

export default function PlayerSeoClient() {
  const router = useRouter();
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  const { user, loading } = useAdminAuth();

  const [data, setData] = useState<SeoPlayerDoc | null>(null);
  const [base, setBase] = useState<SeoPlayerDoc | null>(null);
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

      const res = await fetch("/api/seo/player", { method: "GET" });
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/player")}`);
        return;
      }
      if (!res.ok) throw new Error("Failed to load");

      const json = await res.json();
      setData(json.data);
      setBase(deepClone(json.data));
      setSaveState({ kind: "idle" });
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Error loading data" });
    }
  }

  async function save() {
    if (!data) return;
    setSaveState({ kind: "saving" });
    try {
      const res = await fetch("/api/seo/player", {
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

  // File Upload Logic
  async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setTimeout(() => {
       alert("File selected! Connect API to implement real upload.");
       console.log("Selected file:", file.name);
       setUploading(false);
    }, 1000);
  }

  useEffect(() => {
    if (!loading && (user || BYPASS)) load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const set = (path: string, value: any) => setData((prev: any) => setPath(prev, path, value));

  if (loading || (saveState.kind === "loading" && !data)) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading player settings...</div>
      </div>
    );
  }

  if (!data) return null;

  const p = data.player || {};

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="theme-bg theme-border border rounded-xl p-5 flex items-center justify-between sticky top-4 z-30 shadow-sm">
        <div>
          <div className="text-lg font-black text-primary">Player SEO</div>
          <div className="text-xs text-secondary">Manage patterns for player profile pages.</div>
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
      <Section title="Configuration" description="Technical settings for player pages.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">Revalidate (Seconds)</label>
            <input
              type="number"
              className={inputClass}
              value={p.revalidateSeconds ?? 3600}
              onChange={(e) => set("player.revalidateSeconds", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary uppercase">API Timeout (ms)</label>
            <input
              type="number"
              className={inputClass}
              value={p.apiTimeoutMs ?? 1200}
              onChange={(e) => set("player.apiTimeoutMs", Number(e.target.value))}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary uppercase">Primary Keyword</label>
            <input
              className={inputClass}
              value={p.primaryKeyword ?? ""}
              onChange={(e) => set("player.primaryKeyword", e.target.value)}
            />
          </div>
           <div className="flex items-center gap-2 mt-6">
              <input 
                type="checkbox" 
                checked={p.schema?.enabled ?? true}
                onChange={(e) => set("player.schema.enabled", e.target.checked)}
                className="w-5 h-5 accent-[#0f80da]"
              />
              <span className="text-sm font-bold text-primary">Enable JSON-LD Schema</span>
           </div>
        </div>
      </Section>

      {/* Patterns */}
      <Section title="SEO Patterns" description="Variables: {name}, {team}, {sport}, {brand}">
        <div className="space-y-4">
          <div>
            <label className="text-xs font-black text-secondary uppercase">H1 Pattern</label>
            <input
              className={inputClass}
              value={p.h1Pattern ?? ""}
              onChange={(e) => set("player.h1Pattern", e.target.value)}
            />
          </div>
          
          <div>
            <label className="text-xs font-black text-secondary uppercase">Description Pattern</label>
            <textarea
              className={`${inputClass} min-h-[80px]`}
              value={p.descriptionPattern ?? ""}
              onChange={(e) => set("player.descriptionPattern", e.target.value)}
            />
          </div>

          <div>
             <label className="text-xs font-black text-secondary uppercase mb-2 block">Title Tag Patterns (Array)</label>
             <div className="space-y-2">
                {(p.titlePatterns || []).map((pat, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input 
                      className={inputClass}
                      value={pat}
                      onChange={(e) => {
                        const copy = [...(p.titlePatterns || [])];
                        copy[idx] = e.target.value;
                        set("player.titlePatterns", copy);
                      }}
                    />
                    <button 
                      onClick={() => {
                         const copy = [...(p.titlePatterns || [])];
                         copy.splice(idx, 1);
                         set("player.titlePatterns", copy);
                      }}
                      className="text-red-500 font-bold px-2 hover:bg-red-500/10 rounded-lg"
                    >
                      ×
                    </button>
                  </div>
                ))}
                <button 
                  onClick={() => set("player.titlePatterns", [...(p.titlePatterns || []), "New Pattern"])}
                  className="text-xs font-bold text-[#0f80da] uppercase tracking-wider hover:underline"
                >
                  + Add Pattern
                </button>
             </div>
          </div>
        </div>
      </Section>

      {/* OG Settings */}
      <Section title="Open Graph (Social)" description="Social media share settings.">
         <div>
          <label className="text-xs font-black text-secondary uppercase">Fallback Image</label>
          <div className="flex gap-2">
            <input
              className={inputClass}
              value={p.og?.fallbackImage ?? ""}
              onChange={(e) => set("player.og.fallbackImage", e.target.value)}
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
      </Section>
      
       {/* JSON View */}
      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}