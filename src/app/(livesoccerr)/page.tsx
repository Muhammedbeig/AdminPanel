// src/app/(livesoccerr)/page.tsx
"use client";

import React, { useEffect, useMemo, useState } from "react";
import { LSOCCERR_GLOBAL_TEMPLATE } from "@/livesoccerr/templates/seo-store.global";

type SaveState = { kind: "idle" | "loading" | "saving" | "saved" | "error"; message?: string };
type GlobalStore = any;

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

function replacePlaceholders(text: string, brand: any) {
  return (text || "")
    .replaceAll("{siteName}", brand?.siteName || "")
    .replaceAll("{brand}", brand?.siteName || "");
}

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v);
}

async function safeJson(res: Response) {
  const text = await res.text();
  if (!text) return null; // prevents "Unexpected end of JSON input"
  try {
    return JSON.parse(text);
  } catch {
    throw new Error(text);
  }
}

function Chip({ text, onRemove }: { text: string; onRemove: () => void }) {
  return (
    <span className="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-black theme-border border">
      <span className="text-primary">{text}</span>
      <button type="button" className="text-secondary hover:text-primary" onClick={onRemove}>
        ×
      </button>
    </span>
  );
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

function KeywordAdder({
  disabled,
  inputClass,
  onAdd,
}: {
  disabled: boolean;
  inputClass: string;
  onAdd: (value: string) => void;
}) {
  const [v, setV] = useState("");
  return (
    <div className="mt-3 grid grid-cols-1 md:grid-cols-[1fr_140px] gap-2">
      <input
        className={inputClass}
        value={v}
        disabled={disabled}
        placeholder="Type keyword and press Add"
        onChange={(e) => setV(e.target.value)}
        onKeyDown={(e) => {
          if (e.key === "Enter") {
            e.preventDefault();
            const x = v.trim();
            if (!x) return;
            onAdd(x);
            setV("");
          }
        }}
      />
      <button
        type="button"
        disabled={disabled || !v.trim()}
        className="rounded-2xl px-4 py-3 font-black bg-[#0f80da] text-white disabled:opacity-60"
        onClick={() => {
          const x = v.trim();
          if (!x) return;
          onAdd(x);
          setV("");
        }}
      >
        Add
      </button>
    </div>
  );
}

export default function SeoGlobalPage() {
  const siteId = "livesoccerr";
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const [me, setMe] = useState<{ id: number; email: string; role: string } | null>(null);
  const [meLoading, setMeLoading] = useState(true);

  const [data, setData] = useState<GlobalStore | null>(null);
  const [base, setBase] = useState<GlobalStore | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const inputClass =
    "w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary " +
    "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

  const dirty = useMemo(() => {
    if (!data || !base) return false;
    return JSON.stringify(data) !== JSON.stringify(base);
  }, [data, base]);

  const canEdit =
    BYPASS ||
    me?.role === "ADMIN" ||
    me?.role === "EDITOR" ||
    me?.role === "SEO_MANAGER" ||
    me?.role === "DEVELOPER";

  const set = (path: string, value: any) => setData((prev: any) => setPath(prev, path, value));

  async function loadMe() {
    if (BYPASS) {
      setMe({ id: 0, email: "bypass@local", role: "ADMIN" });
      setMeLoading(false);
      return;
    }

    setMeLoading(true);
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      const j = await safeJson(res);
      if (j?.ok) setMe(j.user);
      else setMe(null);
    } finally {
      setMeLoading(false);
    }
  }

  async function loadGlobal() {
    setSaveState({ kind: "loading" });
    try {
      const res = await fetch("/api/seo/global", { cache: "no-store" });
      const j = await safeJson(res);

      if (!j?.ok) {
        setData(null);
        setBase(null);
        setSaveState({ kind: "error", message: j?.error || "Failed to load" });
        return;
      }

      // Ensure shape exists even on first run
      const loaded = j.data ?? deepClone(LSOCCERR_GLOBAL_TEMPLATE);
      setData(loaded);
      setBase(deepClone(loaded));
      setSaveState({ kind: "idle" });
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Failed to load" });
    }
  }

  async function saveGlobal() {
    if (!data) return;
    setSaveState({ kind: "saving" });

    try {
      const payload = { ...data, updatedAt: new Date().toISOString() };

      const res = await fetch("/api/seo/global", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ data: payload }),
      });

      const j = await safeJson(res);
      if (!j?.ok) throw new Error(j?.error || "Save failed");

      setBase(deepClone(payload));
      setSaveState({ kind: "saved", message: "Saved successfully." });
      setTimeout(() => setSaveState({ kind: "idle" }), 1200);
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Failed to save" });
    }
  }

  async function uploadToServer(file: File, folder: string) {
    const form = new FormData();
    form.append("file", file);
    form.append("folder", folder);

    const res = await fetch("/api/uploads", { method: "POST", body: form });
    const j = await safeJson(res);

    if (!j?.ok || !j?.url) throw new Error(j?.error || "Upload failed");
    return j.url as string;
  }

  useEffect(() => {
    (async () => {
      await loadMe();
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (meLoading) return;
    if (!BYPASS && !me) return;
    loadGlobal();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [meLoading, me]);

  if (meLoading) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading…</div>
      </div>
    );
  }

  if (!BYPASS && !me) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Go to login</div>
      </div>
    );
  }

  if (!data) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">
          {saveState.kind === "loading" ? "Loading…" : "No data loaded."}
        </div>
        {saveState.kind === "error" ? (
          <div className="text-sm text-red-500 mt-2">{saveState.message}</div>
        ) : null}
        <button
          type="button"
          className="mt-4 rounded-2xl px-4 py-2.5 font-black bg-[#0f80da] text-white"
          onClick={loadGlobal}
        >
          Retry
        </button>
      </div>
    );
  }

  const brand = data.brand || {};
  const nav = data.header?.nav || {};
  const allSports: Array<{ id: string; icon: string }> = nav.allSports || [];
  const sportLabels = data.labels?.sportLabels || {};
  const aboutPreview = replacePlaceholders(data.footer?.aboutText || "", brand);

  const logoUrl: string = brand.logoUrl || "";
  const ogFallback: string = data.defaults?.og?.fallbackImage || "";
  const twFallback: string = data.defaults?.twitter?.fallbackImage || "";

  return (
    <div className="space-y-4">
      {/* Top bar */}
      <div className="theme-bg theme-border border rounded-xl p-5 flex flex-col md:flex-row md:items-center gap-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-12 h-12 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
            {logoUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={logoUrl} alt="Logo" className="w-full h-full object-contain" />
            ) : (
              <span className="text-secondary text-xs font-black">LOGO</span>
            )}
          </div>
          <div className="min-w-0">
            <div className="text-lg font-black text-primary truncate">{brand.siteName || "Site Name"}</div>
            <div className="text-sm text-secondary truncate">{brand.tagline || "Tagline"}</div>
          </div>
        </div>

        <div className="md:ml-auto flex items-center gap-2">
          <button
            type="button"
            className="rounded-2xl px-4 py-2.5 font-black theme-border border text-primary disabled:opacity-60"
            onClick={loadGlobal}
            disabled={saveState.kind === "loading" || saveState.kind === "saving"}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-2xl px-4 py-2.5 font-black bg-[#0f80da] text-white disabled:opacity-60"
            onClick={saveGlobal}
            disabled={!dirty || !canEdit || saveState.kind === "loading" || saveState.kind === "saving"}
            title={!canEdit ? "You do not have permission to edit." : ""}
          >
            {saveState.kind === "saving" ? "Saving…" : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {saveState.kind === "error" ? (
        <div className="theme-bg theme-border border rounded-xl p-4 text-sm text-red-500">
          {saveState.message}
        </div>
      ) : saveState.kind === "saved" ? (
        <div className="theme-bg theme-border border rounded-xl p-4 text-sm text-secondary">
          {saveState.message}
        </div>
      ) : null}

      {/* Brand */}
      <Section title="Brand & Website" description="Update the site name, links, and default SEO description shown across the website.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-secondary">Site Name</label>
            <input
              className={inputClass}
              value={brand.siteName || ""}
              onChange={(e) => set("brand.siteName", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Tagline</label>
            <input
              className={inputClass}
              value={brand.tagline || ""}
              onChange={(e) => set("brand.tagline", e.target.value)}
              disabled={!canEdit}
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Website URL</label>
            <input
              className={inputClass}
              value={brand.siteUrl || ""}
              onChange={(e) => set("brand.siteUrl", e.target.value)}
              disabled={!canEdit}
            />
            {brand.siteUrl && !isHttpUrl(brand.siteUrl) ? (
              <div className="text-xs text-red-500 mt-1">Must start with http:// or https://</div>
            ) : null}
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Domain</label>
            <input
              className={inputClass}
              value={brand.siteDomain || ""}
              onChange={(e) => set("brand.siteDomain", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-black text-secondary">Default Meta Description</label>
          <textarea
            className={`${inputClass} min-h-[110px]`}
            value={brand.defaultMetaDescription || ""}
            onChange={(e) => set("brand.defaultMetaDescription", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </Section>

      {/* Images */}
      <Section title="Images (Logo & Social Previews)" description="Upload images and the URL is saved into the JSON.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Logo</div>
            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-secondary text-xs font-black">No logo</span>
              )}
            </div>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*,.svg"
                disabled={!canEdit}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setSaveState({ kind: "saving" });
                  try {
                    const url = await uploadToServer(f, `${siteId}/brand/logo`);
                    set("brand.logoUrl", url);
                    setSaveState({ kind: "saved", message: "Logo uploaded. Click Save Changes." });
                  } catch (err: any) {
                    setSaveState({ kind: "error", message: err?.message || "Upload failed" });
                  } finally {
                    e.target.value = "";
                    setTimeout(() => setSaveState({ kind: "idle" }), 1200);
                  }
                }}
              />
            </div>
          </div>

          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Open Graph Image</div>
            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {ogFallback ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogFallback} alt="OG preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-secondary text-xs font-black">No image</span>
              )}
            </div>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                disabled={!canEdit}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setSaveState({ kind: "saving" });
                  try {
                    const url = await uploadToServer(f, `${siteId}/brand/og`);
                    set("defaults.og.fallbackImage", url);
                    set("brand.defaultOgImage", url);
                    setSaveState({ kind: "saved", message: "OG uploaded. Click Save Changes." });
                  } catch (err: any) {
                    setSaveState({ kind: "error", message: err?.message || "Upload failed" });
                  } finally {
                    e.target.value = "";
                    setTimeout(() => setSaveState({ kind: "idle" }), 1200);
                  }
                }}
              />
            </div>
          </div>

          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Twitter Image</div>
            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {twFallback ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={twFallback} alt="Twitter preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-secondary text-xs font-black">No image</span>
              )}
            </div>
            <div className="mt-3">
              <input
                type="file"
                accept="image/*"
                disabled={!canEdit}
                onChange={async (e) => {
                  const f = e.target.files?.[0];
                  if (!f) return;
                  setSaveState({ kind: "saving" });
                  try {
                    const url = await uploadToServer(f, `${siteId}/brand/twitter`);
                    set("defaults.twitter.fallbackImage", url);
                    setSaveState({ kind: "saved", message: "Twitter uploaded. Click Save Changes." });
                  } catch (err: any) {
                    setSaveState({ kind: "error", message: err?.message || "Upload failed" });
                  } finally {
                    e.target.value = "";
                    setTimeout(() => setSaveState({ kind: "idle" }), 1200);
                  }
                }}
              />
            </div>
          </div>
        </div>
      </Section>

      {/* Keywords */}
      <Section title="Default SEO Settings" description="These apply site-wide unless a page overrides them.">
        <div className="mt-2 flex flex-wrap gap-2">
          {(data.defaults?.keywords || []).map((k: string, idx: number) => (
            <Chip
              key={`${k}-${idx}`}
              text={k}
              onRemove={() => {
                const next = [...(data.defaults?.keywords || [])];
                next.splice(idx, 1);
                set("defaults.keywords", next);
              }}
            />
          ))}
        </div>

        <KeywordAdder
          disabled={!canEdit}
          inputClass={inputClass}
          onAdd={(v) => set("defaults.keywords", [...(data.defaults?.keywords || []), v])}
        />
      </Section>

      {/* Footer */}
      <Section title="Footer & Social Links" description="Update about text and social/app links shown in footer.">
        <div>
          <label className="text-xs font-black text-secondary">About Text</label>
          <textarea
            className={`${inputClass} min-h-[110px]`}
            value={data.footer?.aboutText || ""}
            onChange={(e) => set("footer.aboutText", e.target.value)}
            disabled={!canEdit}
          />
          <div className="text-xs text-secondary mt-2">
            Preview: <span className="text-primary font-semibold">{aboutPreview}</span>
          </div>
        </div>
      </Section>

      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>
    </div>
  );
}
