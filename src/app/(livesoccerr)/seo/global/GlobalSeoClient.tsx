"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type SaveState = { kind: "idle" | "loading" | "saving" | "saved" | "error"; message?: string };

type SeoGlobalDoc = {
  schemaVersion?: number;
  updatedAt?: string;

  brand?: {
    siteName?: string;
    tagline?: string;
    siteUrl?: string;
    siteDomain?: string;
    locale?: string;
    logoUrl?: string;
    logoTitle?: string;
    titlePrefix?: string;
    titleSuffix?: string;
    defaultMetaDescription?: string;
  };

  defaults?: {
    robots?: string;
    keywords?: string[];
    og?: { type?: string; fallbackImage?: string; imageAlt?: string };
    twitter?: { fallbackImage?: string };
  };

  header?: {
    nav?: {
      desktopVisibleCount?: number;
      mobileTop?: string[];
      allSports?: Array<{ id: string; icon: string }>;
    };
  };

  labels?: {
    sportLabels?: Record<string, string>;
  };

  home?: {
    title?: string;
    h1?: string;
    description?: string;
    primaryKeyword?: string;
    canonical?: string;
  };

  footer?: {
    aboutText?: string;
    appLinks?: { googlePlay?: string; appStore?: string };
    socials?: { twitter?: string; facebook?: string; instagram?: string; youtube?: string };
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

function replacePlaceholders(text: string, brand: any) {
  return (text || "")
    .replaceAll("{siteName}", brand?.siteName || "")
    .replaceAll("{brand}", brand?.siteName || "");
}

function isHttpUrl(v: string) {
  return /^https?:\/\//i.test(v);
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

const SEO_DEFAULT_TEMPLATE: SeoGlobalDoc = {
  schemaVersion: 1,
  brand: {
    siteName: "LiveSocceRR",
    tagline: "Scores. Right Now.",
    siteUrl: "https://livesoccerr.com",
    siteDomain: "livesoccerr.com",
    locale: "en_US",
    logoUrl: "/brand/logo.svg",
    logoTitle: "LiveSocceRR Scores",
    titlePrefix: "",
    titleSuffix: "",
    defaultMetaDescription:
      "Live scores, fixtures, and results across Football, Basketball, Baseball, Hockey, Rugby, NFL, and Volleyball.",
  },
  defaults: {
    robots: "index, follow",
    keywords: ["live scores", "fixtures", "results", "standings"],
    og: {
      type: "website",
      fallbackImage: "/og.png",
      imageAlt: "LiveSocceRR social preview",
    },
    twitter: {
      fallbackImage: "/og.png",
    },
  },
  header: {
    nav: {
      desktopVisibleCount: 6,
      mobileTop: ["football", "basketball", "baseball", "hockey", "rugby", "nfl", "volleyball"],
      allSports: [
        { id: "football", icon: "⚽" },
        { id: "basketball", icon: "🏀" },
        { id: "baseball", icon: "⚾" },
        { id: "hockey", icon: "🏒" },
        { id: "rugby", icon: "🏉" },
        { id: "nfl", icon: "🏈" },
        { id: "volleyball", icon: "🏐" },
      ],
    },
  },
  labels: {
    sportLabels: {
      football: "Football",
      basketball: "Basketball",
      baseball: "Baseball",
      hockey: "Hockey",
      rugby: "Rugby",
      nfl: "NFL",
      volleyball: "Volleyball",
    },
  },
  home: {
    title: "LiveSocceRR — Live Scores, Fixtures & Results",
    h1: "Live Scores & Match Updates",
    description:
      "Follow live scores, fixtures, results, standings, and match details across the world’s top sports — updated in real time.",
    primaryKeyword: "live scores",
    canonical: "/",
  },
  footer: {
    aboutText:
      "{siteName} delivers real-time scores, fixtures and results across multiple sports. Stay updated everywhere.",
    appLinks: { googlePlay: "#", appStore: "#" },
    socials: { twitter: "#", facebook: "#", instagram: "#", youtube: "#" },
  },
};

export default function SeoGlobalClient() {
  const router = useRouter();

  const siteKey = "livesoccerr";
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const { user, loading, refresh } = useAdminAuth();

  const [data, setData] = useState<SeoGlobalDoc | null>(null);
  const [base, setBase] = useState<SeoGlobalDoc | null>(null);
  const [saveState, setSaveState] = useState<SaveState>({ kind: "idle" });

  const inputClass =
    "w-full theme-bg theme-border border rounded-2xl px-4 py-3 text-sm font-semibold text-primary " +
    "outline-none focus-visible:ring-2 focus-visible:ring-blue-500/40";

  const dirty = useMemo(() => {
    if (!data || !base) return false;
    return JSON.stringify(data) !== JSON.stringify(base);
  }, [data, base]);

  const canEdit = BYPASS || !!user;

  async function load() {
    setSaveState({ kind: "loading" });
    try {
      if (!BYPASS && !user) {
        setData(null);
        setBase(null);
        setSaveState({ kind: "idle" });
        return;
      }

      const res = await fetch("/api/seo/global", { credentials: "include" });
      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/global")}`);
        return;
      }

      if (!res.ok) throw new Error("Failed to load");
      const json = (await res.json()) as any;

      const doc: SeoGlobalDoc = json?.data || SEO_DEFAULT_TEMPLATE;
      setData(doc);
      setBase(deepClone(doc));
      setSaveState({ kind: "idle" });
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Failed to load" });
    }
  }

  async function save() {
    if (!data) return;
    setSaveState({ kind: "saving" });
    try {
      const payload = { ...data, updatedAt: new Date().toISOString() };

      const res = await fetch("/api/seo/global", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/global")}`);
        return;
      }

      if (!res.ok) {
        const t = await res.text().catch(() => "");
        throw new Error(t || "Failed to save");
      }

      setBase(deepClone(payload));
      setSaveState({ kind: "saved", message: "Saved successfully." });
      setTimeout(() => setSaveState({ kind: "idle" }), 1200);
    } catch (e: any) {
      setSaveState({ kind: "error", message: e?.message || "Failed to save" });
    }
  }

  async function uploadImage(file: File, kind: "logo" | "og" | "twitter") {
    const fd = new FormData();
    fd.append("file", file);
    fd.append("siteKey", siteKey);
    fd.append("kind", kind);

    const res = await fetch("/api/admin/upload-file", {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    if (res.status === 401) {
      router.replace(`/login?next=${encodeURIComponent("/seo/global")}`);
      return null;
    }
    if (!res.ok) throw new Error("Upload failed");

    const json = (await res.json()) as any;
    return (json?.url || "") as string;
  }

  useEffect(() => {
    if (loading) return;
    if (!BYPASS && !user) return;
    load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [loading, user]);

  const set = (path: string, value: any) => setData((prev: any) => setPath(prev, path, value));

  if (loading) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Loading…</div>
      </div>
    );
  }

  if (!BYPASS && !user) {
    return (
      <div className="theme-bg theme-border border rounded-xl p-6">
        <div className="text-sm text-secondary">Please sign in to access Global SEO.</div>
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
            onClick={load}
            disabled={saveState.kind === "loading" || saveState.kind === "saving"}
          >
            Reset
          </button>
          <button
            type="button"
            className="rounded-2xl px-4 py-2.5 font-black bg-[#0f80da] text-white disabled:opacity-60"
            onClick={async () => {
              await save();
              await refresh?.();
            }}
            disabled={!dirty || !canEdit || saveState.kind === "loading" || saveState.kind === "saving"}
            title={!canEdit ? "You do not have permission to edit." : ""}
          >
            {saveState.kind === "saving" ? "Saving…" : dirty ? "Save Changes" : "Saved"}
          </button>
        </div>
      </div>

      {saveState.kind === "error" ? (
        <div className="theme-bg theme-border border rounded-xl p-4 text-sm text-red-500">{saveState.message}</div>
      ) : saveState.kind === "saved" ? (
        <div className="theme-bg theme-border border rounded-xl p-4 text-sm text-secondary">{saveState.message}</div>
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
              placeholder="LiveSocceRR"
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Tagline</label>
            <input
              className={inputClass}
              value={brand.tagline || ""}
              onChange={(e) => set("brand.tagline", e.target.value)}
              disabled={!canEdit}
              placeholder="Scores. Right Now."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Website URL</label>
            <input
              className={inputClass}
              value={brand.siteUrl || ""}
              onChange={(e) => set("brand.siteUrl", e.target.value)}
              disabled={!canEdit}
              placeholder="https://livesoccerr.com"
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
              placeholder="livesoccerr.com"
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Locale</label>
            <input
              className={inputClass}
              value={brand.locale || ""}
              onChange={(e) => set("brand.locale", e.target.value)}
              disabled={!canEdit}
              placeholder="en_US"
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Logo Tooltip/Title</label>
            <input
              className={inputClass}
              value={brand.logoTitle || ""}
              onChange={(e) => set("brand.logoTitle", e.target.value)}
              disabled={!canEdit}
              placeholder="LiveSocceRR Scores"
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Title Prefix</label>
            <input
              className={inputClass}
              value={brand.titlePrefix || ""}
              onChange={(e) => set("brand.titlePrefix", e.target.value)}
              disabled={!canEdit}
              placeholder=""
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Title Suffix</label>
            <input
              className={inputClass}
              value={brand.titleSuffix || ""}
              onChange={(e) => set("brand.titleSuffix", e.target.value)}
              disabled={!canEdit}
              placeholder=""
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

      {/* Uploads */}
      <Section title="Images (Logo & Social Previews)" description="Upload images instead of editing file paths. The image URL is saved automatically.">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-3">
          {/* Logo */}
          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Logo</div>
            <div className="text-xs text-secondary mt-1">Used in header and branding.</div>

            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={logoUrl} alt="Logo preview" className="w-full h-full object-contain" />
              ) : (
                <span className="text-secondary text-xs font-black">No logo</span>
              )}
            </div>

            <div className="mt-3">
              <label className="text-xs font-black text-secondary">Logo URL</label>
              <input
                className={inputClass}
                value={logoUrl}
                onChange={(e) => set("brand.logoUrl", e.target.value)}
                disabled={!canEdit}
                placeholder="/brand/logo.svg"
              />
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
                    const url = await uploadImage(f, "logo");
                    if (url) set("brand.logoUrl", url);
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

          {/* OG fallback */}
          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Open Graph Image</div>
            <div className="text-xs text-secondary mt-1">Used when pages don’t define their own OG image.</div>

            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {ogFallback ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={ogFallback} alt="OG preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-secondary text-xs font-black">No image</span>
              )}
            </div>

            <div className="mt-3">
              <label className="text-xs font-black text-secondary">OG Fallback URL</label>
              <input
                className={inputClass}
                value={ogFallback}
                onChange={(e) => set("defaults.og.fallbackImage", e.target.value)}
                disabled={!canEdit}
                placeholder="/og.png"
              />
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
                    const url = await uploadImage(f, "og");
                    if (url) {
                      set("defaults.og.fallbackImage", url);
                    }
                    setSaveState({ kind: "saved", message: "OG image uploaded. Click Save Changes." });
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

          {/* Twitter fallback */}
          <div className="theme-border border rounded-xl p-4">
            <div className="text-sm font-black text-primary">Twitter Image</div>
            <div className="text-xs text-secondary mt-1">Used for Twitter card preview.</div>

            <div className="mt-3 w-full h-28 rounded-xl theme-border border overflow-hidden bg-black/5 dark:bg-white/5 flex items-center justify-center">
              {twFallback ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={twFallback} alt="Twitter preview" className="w-full h-full object-cover" />
              ) : (
                <span className="text-secondary text-xs font-black">No image</span>
              )}
            </div>

            <div className="mt-3">
              <label className="text-xs font-black text-secondary">Twitter Fallback URL</label>
              <input
                className={inputClass}
                value={twFallback}
                onChange={(e) => set("defaults.twitter.fallbackImage", e.target.value)}
                disabled={!canEdit}
                placeholder="/og.png"
              />
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
                    const url = await uploadImage(f, "twitter");
                    if (url) {
                      set("defaults.twitter.fallbackImage", url);
                    }
                    setSaveState({ kind: "saved", message: "Twitter image uploaded. Click Save Changes." });
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

      {/* Defaults */}
      <Section title="Default SEO Settings" description="These apply site-wide unless a page overrides them.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-secondary">Robots</label>
            <select
              className={inputClass}
              value={data.defaults?.robots || "index, follow"}
              onChange={(e) => set("defaults.robots", e.target.value)}
              disabled={!canEdit}
            >
              <option value="index, follow">index, follow</option>
              <option value="noindex, follow">noindex, follow</option>
              <option value="index, nofollow">index, nofollow</option>
              <option value="noindex, nofollow">noindex, nofollow</option>
            </select>
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Open Graph Type</label>
            <input
              className={inputClass}
              value={data.defaults?.og?.type || ""}
              onChange={(e) => set("defaults.og.type", e.target.value)}
              disabled={!canEdit}
              placeholder="website"
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-black text-secondary">Keywords</label>
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
        </div>

        <div className="mt-4">
          <label className="text-xs font-black text-secondary">OG Image Alt Text</label>
          <input
            className={inputClass}
            value={data.defaults?.og?.imageAlt || ""}
            onChange={(e) => set("defaults.og.imageAlt", e.target.value)}
            disabled={!canEdit}
          />
        </div>
      </Section>

      {/* Home */}
      <Section title="Home Page SEO" description="These affect the homepage only.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-secondary">Home Title</label>
            <input
              className={inputClass}
              value={data.home?.title || ""}
              onChange={(e) => set("home.title", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary">Home H1</label>
            <input
              className={inputClass}
              value={data.home?.h1 || ""}
              onChange={(e) => set("home.h1", e.target.value)}
              disabled={!canEdit}
            />
          </div>
        </div>

        <div className="mt-4">
          <label className="text-xs font-black text-secondary">Home Description</label>
          <textarea
            className={`${inputClass} min-h-[110px]`}
            value={data.home?.description || ""}
            onChange={(e) => set("home.description", e.target.value)}
            disabled={!canEdit}
          />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
          <div>
            <label className="text-xs font-black text-secondary">Primary Keyword</label>
            <input
              className={inputClass}
              value={data.home?.primaryKeyword || ""}
              onChange={(e) => set("home.primaryKeyword", e.target.value)}
              disabled={!canEdit}
            />
          </div>
          <div>
            <label className="text-xs font-black text-secondary">Canonical Path</label>
            <input
              className={inputClass}
              value={data.home?.canonical || ""}
              onChange={(e) => set("home.canonical", e.target.value)}
              disabled={!canEdit}
              placeholder="/"
            />
          </div>
        </div>
      </Section>

      {/* Header/Nav */}
      <Section title="Header Navigation" description="Control which sports show at top and the order on mobile.">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label className="text-xs font-black text-secondary">Desktop visible sports count</label>
            <input
              type="number"
              className={inputClass}
              value={nav.desktopVisibleCount ?? 6}
              onChange={(e) => set("header.nav.desktopVisibleCount", Number(e.target.value || 0))}
              disabled={!canEdit}
              min={1}
              max={20}
            />
          </div>
        </div>

        <div className="mt-5">
          <div className="text-sm font-black text-primary">Mobile Top Sports</div>
          <div className="text-xs text-secondary mt-1">Tap to toggle. These appear first on mobile.</div>

          <div className="mt-3 flex flex-wrap gap-2">
            {allSports.map((s) => {
              const label = sportLabels[s.id] || s.id;
              const selected = (nav.mobileTop || []).includes(s.id);
              return (
                <button
                  key={s.id}
                  type="button"
                  disabled={!canEdit}
                  onClick={() => {
                    const cur = nav.mobileTop || [];
                    const next = selected ? cur.filter((x: string) => x !== s.id) : [...cur, s.id];
                    set("header.nav.mobileTop", next);
                  }}
                  className={[
                    "px-3 py-2 rounded-full border text-sm font-black transition-colors",
                    selected
                      ? "bg-[#0f80da] text-white border-[#0f80da]"
                      : "theme-bg theme-border text-primary hover:bg-black/5 dark:hover:bg-white/10",
                    !canEdit ? "opacity-60" : "",
                  ].join(" ")}
                >
                  <span className="mr-2">{s.icon}</span>
                  {label}
                </button>
              );
            })}
          </div>
        </div>

        <div className="mt-6">
          <div className="text-sm font-black text-primary">Sport Names & Icons</div>
          <div className="text-xs text-secondary mt-1">Editable labels/icons that show in navigation.</div>

          <div className="mt-3 space-y-2">
            {allSports.map((s, idx) => (
              <div
                key={`${s.id}-${idx}`}
                className="theme-border border rounded-xl p-3 grid grid-cols-1 md:grid-cols-[180px_1fr_120px] gap-2 items-center"
              >
                <div className="text-sm font-black text-primary">{s.id}</div>

                <input
                  className={inputClass}
                  value={sportLabels[s.id] || ""}
                  onChange={(e) => {
                    const next = { ...(data.labels?.sportLabels || {}) };
                    next[s.id] = e.target.value;
                    set("labels.sportLabels", next);
                  }}
                  disabled={!canEdit}
                  placeholder="Label (e.g., Football)"
                />

                <input
                  className={inputClass}
                  value={s.icon || ""}
                  onChange={(e) => {
                    const next = [...allSports];
                    next[idx] = { ...next[idx], icon: e.target.value };
                    set("header.nav.allSports", next);
                  }}
                  disabled={!canEdit}
                  placeholder="⚽"
                />
              </div>
            ))}
          </div>
        </div>
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

        <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-5">
          <div>
            <label className="text-xs font-black text-secondary">Google Play Link</label>
            <input
              className={inputClass}
              value={data.footer?.appLinks?.googlePlay || ""}
              onChange={(e) => set("footer.appLinks.googlePlay", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">App Store Link</label>
            <input
              className={inputClass}
              value={data.footer?.appLinks?.appStore || ""}
              onChange={(e) => set("footer.appLinks.appStore", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Twitter</label>
            <input
              className={inputClass}
              value={data.footer?.socials?.twitter || ""}
              onChange={(e) => set("footer.socials.twitter", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Facebook</label>
            <input
              className={inputClass}
              value={data.footer?.socials?.facebook || ""}
              onChange={(e) => set("footer.socials.facebook", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">Instagram</label>
            <input
              className={inputClass}
              value={data.footer?.socials?.instagram || ""}
              onChange={(e) => set("footer.socials.instagram", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>

          <div>
            <label className="text-xs font-black text-secondary">YouTube</label>
            <input
              className={inputClass}
              value={data.footer?.socials?.youtube || ""}
              onChange={(e) => set("footer.socials.youtube", e.target.value)}
              disabled={!canEdit}
              placeholder="# or https://..."
            />
          </div>
        </div>
      </Section>

      {/* Advanced */}
      <details className="theme-bg theme-border border rounded-xl p-6">
        <summary className="cursor-pointer text-sm font-black text-primary">Advanced: View JSON</summary>
        <pre className="mt-4 text-xs overflow-auto whitespace-pre-wrap text-secondary">{JSON.stringify(data, null, 2)}</pre>
      </details>

      {/* Bottom save */}
      <div className="flex items-center justify-end gap-2 pb-4">
        <button
          type="button"
          className="rounded-2xl px-4 py-2.5 font-black theme-border border text-primary disabled:opacity-60"
          onClick={load}
          disabled={saveState.kind === "loading" || saveState.kind === "saving"}
        >
          Reset
        </button>
        <button
          type="button"
          className="rounded-2xl px-4 py-2.5 font-black bg-[#0f80da] text-white disabled:opacity-60"
          onClick={save}
          disabled={!dirty || !canEdit || saveState.kind === "loading" || saveState.kind === "saving"}
        >
          {saveState.kind === "saving" ? "Saving…" : dirty ? "Save Changes" : "Saved"}
        </button>
      </div>
    </div>
  );
}
