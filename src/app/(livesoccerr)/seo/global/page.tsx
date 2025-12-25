"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";

type SportNavItem = { id: string; icon: string };

type SeoGlobalDoc = {
  schemaVersion: number;
  updatedAt: string;

  brand: {
    siteName: string;
    siteUrl: string;
    siteDomain: string;
    tagline: string;
    logoTitle: string;
    logoUrl: string;
    titlePrefix: string;
    titleSuffix: string;
    defaultOgImage: string;
    defaultMetaDescription: string;
    locale: string;
  };

  labels: {
    sportLabels: Record<string, string>;
  };

  header: {
    nav: {
      desktopVisibleCount: number;
      mobileTop: string[];
      allSports: SportNavItem[];
    };
  };

  footer: {
    aboutText: string;
    appLinks: {
      googlePlay: string;
      appStore: string;
    };
    socials: {
      twitter: string;
      facebook: string;
      instagram: string;
      youtube: string;
    };
  };

  defaults: {
    robots: string;
    keywords: string[];
    og: {
      type: string;
      fallbackImage: string;
      imageAlt: string;
    };
    twitter: {
      card: string;
      fallbackImage: string;
    };
  };

  auto: {
    autoTitlePattern: string;
    autoDescriptionPattern: string;
    autoSchema: boolean;
  };

  home: {
    title: string;
    description: string;
    h1: string;
    primaryKeyword: string;
    keywords: string[];
    canonical: string;
  };

  overrides: Record<string, unknown>;
};

type ApiOk<T> = { ok: true; data: T };
type ApiFail = { ok: false; error?: string; message?: string };
type ApiResp<T> = ApiOk<T> | ApiFail;

function cx(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(" ");
}

function deepClone<T>(v: T): T {
  return JSON.parse(JSON.stringify(v)) as T;
}

function isAbsUrl(u: string) {
  return /^https?:\/\//i.test(u);
}

function resolveAssetUrl(doc: SeoGlobalDoc | null, maybeUrl: string) {
  const u = (maybeUrl || "").trim();
  if (!u) return "";

  if (isAbsUrl(u)) return u;

  // If we uploaded via THIS admin app, it will be /uploads/...
  // Preview those on the current origin so the preview works in dev.
  if (u.startsWith("/uploads/") && typeof window !== "undefined") {
    return `${window.location.origin}${u}`;
  }

  // Otherwise preview relative paths using siteUrl (main site)
  const base = (doc?.brand?.siteUrl || "").trim();
  try {
    if (base) return new URL(u, base).toString();
  } catch {
    // ignore
  }
  return u;
}

async function safeJson<T>(res: Response): Promise<T> {
  const txt = await res.text();
  if (!txt) throw new Error("Empty response from server.");
  try {
    return JSON.parse(txt) as T;
  } catch {
    throw new Error(txt.length > 200 ? txt.slice(0, 200) + "…" : txt);
  }
}

function Section({
  title,
  subtitle,
  children,
}: {
  title: string;
  subtitle?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="theme-bg theme-border border rounded-2xl p-5 md:p-6 shadow-sm">
      <div>
        <div className="text-base md:text-lg font-black text-primary">{title}</div>
        {subtitle ? <div className="text-sm text-secondary mt-1">{subtitle}</div> : null}
      </div>
      <div className="mt-5 space-y-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  children,
}: {
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="flex items-baseline justify-between gap-3">
        <div className="text-xs font-black text-secondary">{label}</div>
        {hint ? <div className="text-[11px] text-secondary/80">{hint}</div> : null}
      </div>
      <div className="mt-1">{children}</div>
    </div>
  );
}

function TextInput(props: React.InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      {...props}
      className={cx(
        "w-full theme-border border rounded-xl px-3 py-2 theme-bg text-primary outline-none",
        "focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10",
        props.className
      )}
    />
  );
}

function TextArea(props: React.TextareaHTMLAttributes<HTMLTextAreaElement>) {
  return (
    <textarea
      {...props}
      className={cx(
        "w-full theme-border border rounded-xl px-3 py-2 theme-bg text-primary outline-none",
        "focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10",
        props.className
      )}
    />
  );
}

function SmallBtn({
  children,
  onClick,
  disabled,
  kind = "ghost",
}: {
  children: React.ReactNode;
  onClick?: () => void;
  disabled?: boolean;
  kind?: "ghost" | "primary" | "danger";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={cx(
        "rounded-xl px-3 py-2 text-sm font-black disabled:opacity-60",
        kind === "ghost" && "theme-border border text-primary",
        kind === "primary" && "bg-[#0f80da] text-white",
        kind === "danger" && "bg-red-600 text-white"
      )}
    >
      {children}
    </button>
  );
}

function ArrayEditor({
  value,
  onChange,
  placeholder = "Add item…",
}: {
  value: string[];
  onChange: (next: string[]) => void;
  placeholder?: string;
}) {
  const [draft, setDraft] = useState("");

  return (
    <div className="space-y-2">
      {value.length ? (
        <div className="space-y-2">
          {value.map((v, idx) => (
            <div key={`${v}-${idx}`} className="flex gap-2">
              <TextInput
                value={v}
                onChange={(e) => {
                  const next = value.slice();
                  next[idx] = e.target.value;
                  onChange(next);
                }}
              />
              <SmallBtn
                kind="danger"
                onClick={() => {
                  const next = value.slice();
                  next.splice(idx, 1);
                  onChange(next);
                }}
              >
                Remove
              </SmallBtn>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-secondary">No items.</div>
      )}

      <div className="flex gap-2">
        <TextInput value={draft} onChange={(e) => setDraft(e.target.value)} placeholder={placeholder} />
        <SmallBtn
          kind="primary"
          onClick={() => {
            const x = draft.trim();
            if (!x) return;
            onChange([...value, x]);
            setDraft("");
          }}
        >
          Add
        </SmallBtn>
      </div>
    </div>
  );
}

function MapEditor({
  value,
  onChange,
  keyLabel = "Key",
  valLabel = "Value",
}: {
  value: Record<string, string>;
  onChange: (next: Record<string, string>) => void;
  keyLabel?: string;
  valLabel?: string;
}) {
  const entries = Object.entries(value || {});
  const [k, setK] = useState("");
  const [v, setV] = useState("");

  return (
    <div className="space-y-2">
      {entries.length ? (
        <div className="space-y-2">
          {entries.map(([key, val]) => (
            <div key={key} className="grid grid-cols-1 md:grid-cols-12 gap-2">
              <div className="md:col-span-4">
                <TextInput value={key} disabled />
              </div>
              <div className="md:col-span-6">
                <TextInput
                  value={val}
                  onChange={(e) => {
                    const next = { ...(value || {}) };
                    next[key] = e.target.value;
                    onChange(next);
                  }}
                />
              </div>
              <div className="md:col-span-2">
                <SmallBtn
                  kind="danger"
                  onClick={() => {
                    const next = { ...(value || {}) };
                    delete next[key];
                    onChange(next);
                  }}
                >
                  Remove
                </SmallBtn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-secondary">No entries.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-4">
          <TextInput value={k} onChange={(e) => setK(e.target.value)} placeholder={keyLabel} />
        </div>
        <div className="md:col-span-6">
          <TextInput value={v} onChange={(e) => setV(e.target.value)} placeholder={valLabel} />
        </div>
        <div className="md:col-span-2">
          <SmallBtn
            kind="primary"
            onClick={() => {
              const kk = k.trim();
              if (!kk) return;
              const next = { ...(value || {}) };
              next[kk] = v;
              onChange(next);
              setK("");
              setV("");
            }}
          >
            Add
          </SmallBtn>
        </div>
      </div>
    </div>
  );
}

function NavListEditor({
  value,
  onChange,
}: {
  value: SportNavItem[];
  onChange: (next: SportNavItem[]) => void;
}) {
  const [id, setId] = useState("");
  const [icon, setIcon] = useState("");

  return (
    <div className="space-y-2">
      {value.length ? (
        <div className="space-y-2">
          {value.map((it, idx) => (
            <div key={`${it.id}-${idx}`} className="grid grid-cols-1 md:grid-cols-12 gap-2 items-center">
              <div className="md:col-span-4">
                <TextInput
                  value={it.id}
                  onChange={(e) => {
                    const next = value.slice();
                    next[idx] = { ...next[idx], id: e.target.value };
                    onChange(next);
                  }}
                />
              </div>
              <div className="md:col-span-3">
                <TextInput
                  value={it.icon}
                  onChange={(e) => {
                    const next = value.slice();
                    next[idx] = { ...next[idx], icon: e.target.value };
                    onChange(next);
                  }}
                />
              </div>
              <div className="md:col-span-5 flex gap-2 justify-end">
                <SmallBtn
                  onClick={() => {
                    if (idx === 0) return;
                    const next = value.slice();
                    const tmp = next[idx - 1];
                    next[idx - 1] = next[idx];
                    next[idx] = tmp;
                    onChange(next);
                  }}
                >
                  ↑
                </SmallBtn>
                <SmallBtn
                  onClick={() => {
                    if (idx === value.length - 1) return;
                    const next = value.slice();
                    const tmp = next[idx + 1];
                    next[idx + 1] = next[idx];
                    next[idx] = tmp;
                    onChange(next);
                  }}
                >
                  ↓
                </SmallBtn>
                <SmallBtn
                  kind="danger"
                  onClick={() => {
                    const next = value.slice();
                    next.splice(idx, 1);
                    onChange(next);
                  }}
                >
                  Remove
                </SmallBtn>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-sm text-secondary">No items.</div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-12 gap-2">
        <div className="md:col-span-5">
          <TextInput value={id} onChange={(e) => setId(e.target.value)} placeholder="Sport ID (e.g. football)" />
        </div>
        <div className="md:col-span-5">
          <TextInput value={icon} onChange={(e) => setIcon(e.target.value)} placeholder="Icon (e.g. ⚽)" />
        </div>
        <div className="md:col-span-2">
          <SmallBtn
            kind="primary"
            onClick={() => {
              const sid = id.trim();
              if (!sid) return;
              onChange([...(value || []), { id: sid, icon: icon || "" }]);
              setId("");
              setIcon("");
            }}
          >
            Add
          </SmallBtn>
        </div>
      </div>
    </div>
  );
}

function FileUploadField({
  doc,
  label,
  value,
  onChange,
  accept,
}: {
  doc: SeoGlobalDoc | null;
  label: string;
  value: string;
  onChange: (next: string) => void;
  accept: string;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const preview = resolveAssetUrl(doc, value);

  const doUpload = async (file: File) => {
    setErr(null);
    setBusy(true);
    try {
      const fd = new FormData();
      fd.append("file", file);

      // ✅ your route is /api/uploads
      const res = await fetch("/api/uploads", {
        method: "POST",
        body: fd,
        credentials: "include",
      });

      if (res.status === 401) throw new Error("Unauthorized. Please login again.");

      const j = await safeJson<ApiResp<{ url: string }>>(res);
      if (!("ok" in j) || !j.ok) throw new Error(j.error || j.message || "Upload failed");

      onChange(j.data.url);
    } catch (e: any) {
      setErr(e?.message || "Upload failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="space-y-2">
      <Field label={label} hint="Paste a URL or upload a file">
        <TextInput value={value} onChange={(e) => onChange(e.target.value)} placeholder="/brand/logo.svg or https://…" />
      </Field>

      <div className="flex flex-col md:flex-row md:items-center gap-2">
        <input
          type="file"
          accept={accept}
          disabled={busy}
          onChange={(e) => {
            const f = e.target.files?.[0];
            if (f) void doUpload(f);
            e.currentTarget.value = "";
          }}
          className="block w-full text-sm text-secondary file:mr-3 file:rounded-xl file:border file:border-black/10 dark:file:border-white/10 file:px-3 file:py-2 file:font-black file:bg-transparent file:text-primary"
        />
        <div className="text-[11px] text-secondary/80">
          Max 5MB. Upload saves to <span className="font-semibold">/public/uploads</span>.
        </div>
      </div>

      {err ? (
        <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
          {err}
        </div>
      ) : null}

      {preview ? (
        <div className="theme-border border rounded-2xl p-3">
          <div className="text-xs font-black text-secondary mb-2">Preview</div>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={preview} alt={label} className="max-h-28 w-auto rounded-lg" />
          <div className="mt-2 text-[11px] text-secondary break-all">{preview}</div>
          <div className="mt-2">
            <a className="text-[11px] font-black text-primary underline" href={preview} target="_blank" rel="noreferrer">
              Open preview
            </a>
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default function GlobalSeoPage() {
  const router = useRouter();

  const [doc, setDoc] = useState<SeoGlobalDoc | null>(null);
  const [draft, setDraft] = useState<SeoGlobalDoc | null>(null);

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [okMsg, setOkMsg] = useState<string | null>(null);

  const updatedLabel = useMemo(() => {
    const t = draft?.updatedAt || doc?.updatedAt;
    if (!t) return "";
    try {
      return new Date(t).toLocaleString();
    } catch {
      return t;
    }
  }, [doc?.updatedAt, draft?.updatedAt]);

  const load = async () => {
    setErr(null);
    setOkMsg(null);
    setLoading(true);
    try {
      const res = await fetch("/api/seo/global", { credentials: "include" });

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/global")}`);
        return;
      }

      const j = await safeJson<ApiResp<SeoGlobalDoc>>(res);
      if (!("ok" in j) || !j.ok) throw new Error(j.error || j.message || "Failed to load");

      setDoc(j.data);
      setDraft(deepClone(j.data));
    } catch (e: any) {
      setErr(e?.message || "Failed to load");
      setDoc(null);
      setDraft(null);
    } finally {
      setLoading(false);
    }
  };

  const save = async () => {
    if (!draft) return;
    setErr(null);
    setOkMsg(null);
    setSaving(true);
    try {
      const res = await fetch("/api/seo/global", {
        method: "PUT",
        headers: { "content-type": "application/json" },
        credentials: "include",
        body: JSON.stringify(draft),
      });

      if (res.status === 401) {
        router.replace(`/login?next=${encodeURIComponent("/seo/global")}`);
        return;
      }

      const j = await safeJson<ApiResp<SeoGlobalDoc>>(res);
      if (!("ok" in j) || !j.ok) throw new Error(j.error || j.message || "Save failed");

      setDoc(j.data);
      setDraft(deepClone(j.data));
      setOkMsg("Saved successfully.");
      setTimeout(() => setOkMsg(null), 2500);
    } catch (e: any) {
      setErr(e?.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  const downloadJson = () => {
    if (!draft) return;
    const blob = new Blob([JSON.stringify(draft, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "seo-store.global.json";
    a.click();
    URL.revokeObjectURL(url);
  };

  useEffect(() => {
    void load();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // ✅ FIX: show real error state instead of infinite “Loading…” when draft is null
  if (loading) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="theme-bg theme-border border rounded-2xl p-6">
          <div className="text-xl font-black text-primary">Global SEO</div>
          <div className="text-sm text-secondary mt-2">Loading…</div>
        </div>
      </div>
    );
  }

  if (!draft) {
    return (
      <div className="max-w-5xl mx-auto px-4 py-10">
        <div className="theme-bg theme-border border rounded-2xl p-6">
          <div className="text-xl font-black text-primary">Global SEO</div>
          <div className="text-sm text-secondary mt-2">No data loaded.</div>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </div>
          ) : null}

          <div className="mt-5 flex gap-2">
            <SmallBtn onClick={load}>Retry</SmallBtn>
            <SmallBtn onClick={() => router.replace(`/login?next=${encodeURIComponent("/seo/global")}`)}>
              Go to login
            </SmallBtn>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto px-4 py-10 space-y-6">
      <div className="theme-bg theme-border border rounded-2xl p-5 md:p-6 shadow-sm">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div>
            <div className="text-xl font-black text-primary">Global SEO</div>
            <div className="text-sm text-secondary mt-1">
              Edit global defaults for <span className="font-black text-primary">{draft.brand.siteDomain}</span>.
            </div>
            {updatedLabel ? <div className="text-[11px] text-secondary mt-2">Last updated: {updatedLabel}</div> : null}
          </div>

          <div className="flex flex-wrap gap-2 justify-start md:justify-end">
            <SmallBtn onClick={downloadJson}>Download JSON</SmallBtn>
            <SmallBtn onClick={load} disabled={saving}>
              Reload
            </SmallBtn>
            <SmallBtn kind="primary" onClick={save} disabled={saving}>
              {saving ? "Saving…" : "Save changes"}
            </SmallBtn>
          </div>
        </div>

        {err ? (
          <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
            {err}
          </div>
        ) : null}

        {okMsg ? (
          <div className="mt-4 rounded-xl border border-emerald-500/30 bg-emerald-500/10 px-3 py-2 text-sm text-emerald-800 dark:text-emerald-200">
            {okMsg}
          </div>
        ) : null}
      </div>

      <Section title="Brand" subtitle="Core identity and default metadata">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Site name">
            <TextInput
              value={draft.brand.siteName}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, siteName: e.target.value } })}
            />
          </Field>

          <Field label="Site domain" hint="e.g. livesoccerr.com">
            <TextInput
              value={draft.brand.siteDomain}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, siteDomain: e.target.value } })}
            />
          </Field>

          <Field label="Site URL" hint="Used for previewing relative assets">
            <TextInput
              value={draft.brand.siteUrl}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, siteUrl: e.target.value } })}
            />
          </Field>

          <Field label="Locale" hint="e.g. en_US">
            <TextInput
              value={draft.brand.locale}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, locale: e.target.value } })}
            />
          </Field>

          <Field label="Tagline">
            <TextInput
              value={draft.brand.tagline}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, tagline: e.target.value } })}
            />
          </Field>

          <Field label="Logo title" hint="Used for title/alt in some components">
            <TextInput
              value={draft.brand.logoTitle}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, logoTitle: e.target.value } })}
            />
          </Field>

          <Field label="Title prefix" hint="Optional">
            <TextInput
              value={draft.brand.titlePrefix}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, titlePrefix: e.target.value } })}
            />
          </Field>

          <Field label="Title suffix" hint="Optional">
            <TextInput
              value={draft.brand.titleSuffix}
              onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, titleSuffix: e.target.value } })}
            />
          </Field>
        </div>

        <FileUploadField
          doc={draft}
          label="Logo URL"
          value={draft.brand.logoUrl}
          onChange={(next) => setDraft({ ...draft, brand: { ...draft.brand, logoUrl: next } })}
          accept="image/*,.svg"
        />

        <FileUploadField
          doc={draft}
          label="Default OG Image (Brand)"
          value={draft.brand.defaultOgImage}
          onChange={(next) => setDraft({ ...draft, brand: { ...draft.brand, defaultOgImage: next } })}
          accept="image/*"
        />

        <Field label="Default meta description">
          <TextArea
            rows={4}
            value={draft.brand.defaultMetaDescription}
            onChange={(e) => setDraft({ ...draft, brand: { ...draft.brand, defaultMetaDescription: e.target.value } })}
          />
        </Field>
      </Section>

      <Section title="Labels" subtitle="Human-readable labels for sports (used across UI + SEO)">
        <Field label="Sport labels" hint="Key = sport id, Value = label">
          <MapEditor
            value={draft.labels.sportLabels}
            onChange={(next) => setDraft({ ...draft, labels: { ...draft.labels, sportLabels: next } })}
            keyLabel="sport id"
            valLabel="label"
          />
        </Field>
      </Section>

      <Section title="Header Navigation" subtitle="Desktop count + mobile top + all sports list">
        <Field label="Desktop visible count" hint="Number">
          <TextInput
            type="number"
            value={String(draft.header.nav.desktopVisibleCount)}
            onChange={(e) =>
              setDraft({
                ...draft,
                header: {
                  ...draft.header,
                  nav: { ...draft.header.nav, desktopVisibleCount: Number(e.target.value || 0) },
                },
              })
            }
          />
        </Field>

        <Field label="Mobile top sports" hint="Order matters">
          <ArrayEditor
            value={draft.header.nav.mobileTop}
            onChange={(next) => setDraft({ ...draft, header: { ...draft.header, nav: { ...draft.header.nav, mobileTop: next } } })}
            placeholder="e.g. football"
          />
        </Field>

        <Field label="All sports (id + icon)" hint="Used to render the sports list">
          <NavListEditor
            value={draft.header.nav.allSports}
            onChange={(next) => setDraft({ ...draft, header: { ...draft.header, nav: { ...draft.header.nav, allSports: next } } })}
          />
        </Field>
      </Section>

      <Section title="Footer" subtitle="About text, app links, social links">
        <Field label="About text" hint="You can use {siteName}">
          <TextArea
            rows={4}
            value={draft.footer.aboutText}
            onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, aboutText: e.target.value } })}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Google Play link">
            <TextInput
              value={draft.footer.appLinks.googlePlay}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, appLinks: { ...draft.footer.appLinks, googlePlay: e.target.value } } })}
            />
          </Field>

          <Field label="App Store link">
            <TextInput
              value={draft.footer.appLinks.appStore}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, appLinks: { ...draft.footer.appLinks, appStore: e.target.value } } })}
            />
          </Field>

          <Field label="Twitter">
            <TextInput
              value={draft.footer.socials.twitter}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, socials: { ...draft.footer.socials, twitter: e.target.value } } })}
            />
          </Field>

          <Field label="Facebook">
            <TextInput
              value={draft.footer.socials.facebook}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, socials: { ...draft.footer.socials, facebook: e.target.value } } })}
            />
          </Field>

          <Field label="Instagram">
            <TextInput
              value={draft.footer.socials.instagram}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, socials: { ...draft.footer.socials, instagram: e.target.value } } })}
            />
          </Field>

          <Field label="YouTube">
            <TextInput
              value={draft.footer.socials.youtube}
              onChange={(e) => setDraft({ ...draft, footer: { ...draft.footer, socials: { ...draft.footer.socials, youtube: e.target.value } } })}
            />
          </Field>
        </div>
      </Section>

      <Section title="Defaults" subtitle="Robots, keywords, OG and Twitter defaults">
        <Field label="Robots meta">
          <TextInput
            value={draft.defaults.robots}
            onChange={(e) => setDraft({ ...draft, defaults: { ...draft.defaults, robots: e.target.value } })}
          />
        </Field>

        <Field label="Default keywords">
          <ArrayEditor
            value={draft.defaults.keywords}
            onChange={(next) => setDraft({ ...draft, defaults: { ...draft.defaults, keywords: next } })}
          />
        </Field>

        <Field label="OG type">
          <TextInput
            value={draft.defaults.og.type}
            onChange={(e) => setDraft({ ...draft, defaults: { ...draft.defaults, og: { ...draft.defaults.og, type: e.target.value } } })}
          />
        </Field>

        <FileUploadField
          doc={draft}
          label="OG fallback image"
          value={draft.defaults.og.fallbackImage}
          onChange={(next) => setDraft({ ...draft, defaults: { ...draft.defaults, og: { ...draft.defaults.og, fallbackImage: next } } })}
          accept="image/*"
        />

        <Field label="OG image alt text">
          <TextInput
            value={draft.defaults.og.imageAlt}
            onChange={(e) => setDraft({ ...draft, defaults: { ...draft.defaults, og: { ...draft.defaults.og, imageAlt: e.target.value } } })}
          />
        </Field>

        <Field label="Twitter card">
          <TextInput
            value={draft.defaults.twitter.card}
            onChange={(e) => setDraft({ ...draft, defaults: { ...draft.defaults, twitter: { ...draft.defaults.twitter, card: e.target.value } } })}
          />
        </Field>

        <FileUploadField
          doc={draft}
          label="Twitter fallback image"
          value={draft.defaults.twitter.fallbackImage}
          onChange={(next) => setDraft({ ...draft, defaults: { ...draft.defaults, twitter: { ...draft.defaults.twitter, fallbackImage: next } } })}
          accept="image/*"
        />
      </Section>

      <Section title="Auto-generation rules" subtitle="Patterns + schema auto toggle">
        <Field label="Auto title pattern" hint='Example: "{title} | {brand}"'>
          <TextInput
            value={draft.auto.autoTitlePattern}
            onChange={(e) => setDraft({ ...draft, auto: { ...draft.auto, autoTitlePattern: e.target.value } })}
          />
        </Field>

        <Field label="Auto description pattern" hint='Example: "{description}"'>
          <TextInput
            value={draft.auto.autoDescriptionPattern}
            onChange={(e) => setDraft({ ...draft, auto: { ...draft.auto, autoDescriptionPattern: e.target.value } })}
          />
        </Field>

        <Field label="Auto-generate schema">
          <label className="inline-flex items-center gap-2 theme-border border rounded-xl px-3 py-2 cursor-pointer select-none">
            <input
              type="checkbox"
              checked={Boolean(draft.auto.autoSchema)}
              onChange={(e) => setDraft({ ...draft, auto: { ...draft.auto, autoSchema: e.target.checked } })}
            />
            <span className="text-sm font-black text-primary">{draft.auto.autoSchema ? "Enabled" : "Disabled"}</span>
          </label>
        </Field>
      </Section>

      <Section title="Home page SEO" subtitle="Home title/description + keywords + canonical">
        <Field label="Home title">
          <TextInput
            value={draft.home.title}
            onChange={(e) => setDraft({ ...draft, home: { ...draft.home, title: e.target.value } })}
          />
        </Field>

        <Field label="Home description">
          <TextArea
            rows={4}
            value={draft.home.description}
            onChange={(e) => setDraft({ ...draft, home: { ...draft.home, description: e.target.value } })}
          />
        </Field>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <Field label="Home H1">
            <TextInput value={draft.home.h1} onChange={(e) => setDraft({ ...draft, home: { ...draft.home, h1: e.target.value } })} />
          </Field>

          <Field label="Primary keyword">
            <TextInput
              value={draft.home.primaryKeyword}
              onChange={(e) => setDraft({ ...draft, home: { ...draft.home, primaryKeyword: e.target.value } })}
            />
          </Field>
        </div>

        <Field label="Home keywords">
          <ArrayEditor
            value={draft.home.keywords}
            onChange={(next) => setDraft({ ...draft, home: { ...draft.home, keywords: next } })}
          />
        </Field>

        <Field label="Canonical" hint="Usually /">
          <TextInput value={draft.home.canonical} onChange={(e) => setDraft({ ...draft, home: { ...draft.home, canonical: e.target.value } })} />
        </Field>
      </Section>

      <Section title="Advanced" subtitle="Overrides object (keep empty unless you know what you’re doing)">
        <Field label="Overrides (JSON)">
          <TextArea
            rows={8}
            value={JSON.stringify(draft.overrides || {}, null, 2)}
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value || "{}") as Record<string, unknown>;
                setDraft({ ...draft, overrides: parsed });
                setErr(null);
              } catch {
                setErr("Overrides JSON is invalid.");
              }
            }}
          />
        </Field>
      </Section>
    </div>
  );
}
