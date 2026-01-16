// app/admin/src/app/settings/WebSettingsClient.tsx
"use client";

import React, { useEffect, useState } from "react";
import {
  Save,
  MapPin,
  Globe,
  Layout,
  Facebook,
  Linkedin,
  Instagram,
  Monitor,
  Plus,
  Trash2,
  Eye,
  EyeOff,
} from "lucide-react";

type EnvVar = { key: string; value: string };

function normalizeKey(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");
}

export default function WebSettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [envReady, setEnvReady] = useState(false);
  const [envError, setEnvError] = useState<string | null>(null);
  const [revealEnv, setRevealEnv] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState({
    themeColor: "#0f80da",

    headerLogo: "",
    favicon: "",          // ✅ NEW
    footerLogo: "",
    placeholderImage: "",

    footerDescription: "",
    googleMapUrl: "",
    showLandingPage: true,
    latitude: "",
    longitude: "",

    socialInstagram: "",
    socialX: "",
    socialFacebook: "",
    socialLinkedin: "",
    socialPinterest: "",
  });

  useEffect(() => {
    fetch("/api/admin/web-settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((j) => {
        if (j.ok && j.settings) {
          setFormData((prev) => ({
            ...prev,
            ...j.settings,

            themeColor: j.settings.themeColor || "#0f80da",
            headerLogo: j.settings.headerLogo || "",
            favicon: j.settings.favicon || "", // ✅ NEW
            footerLogo: j.settings.footerLogo || "",
            placeholderImage: j.settings.placeholderImage || "",
            footerDescription: j.settings.footerDescription || "",
            googleMapUrl: j.settings.googleMapUrl || "",
            latitude: j.settings.latitude || "",
            longitude: j.settings.longitude || "",
            socialInstagram: j.settings.socialInstagram || "",
            socialX: j.settings.socialX || "",
            socialFacebook: j.settings.socialFacebook || "",
            socialLinkedin: j.settings.socialLinkedin || "",
            socialPinterest: j.settings.socialPinterest || "",
            showLandingPage: j.settings.showLandingPage ?? true,
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  useEffect(() => {
    let alive = true;

    fetch("/api/admin/env-variables", { cache: "no-store" })
      .then((res) => res.json())
      .then((j) => {
        if (!alive) return;
        if (j?.ok && Array.isArray(j.envVariables)) {
          setEnvVars(
            j.envVariables.map((e: any) => ({
              key: String(e?.key || ""),
              value: String(e?.value || ""),
            }))
          );
          setEnvReady(true);
          setEnvError(null);
        } else {
          setEnvReady(false);
          setEnvError(j?.error || "Failed to load environment variables.");
        }
      })
      .catch(() => {
        if (!alive) return;
        setEnvReady(false);
        setEnvError("Failed to load environment variables.");
      });

    return () => {
      alive = false;
    };
  }, []);

  // Optional live preview for favicon in ADMIN UI
  useEffect(() => {
    if (!formData.favicon) return;

    let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
    if (!link) {
      link = document.createElement("link");
      link.rel = "icon";
      document.getElementsByTagName("head")[0].appendChild(link);
    }
    link.href = formData.favicon;
  }, [formData.favicon]);

  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/web-settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json().catch(() => ({}));
      const webOk = res.ok && data.ok;

      let envOk = true;
      let envErr = "";

      if (envReady) {
        const envRes = await fetch("/api/admin/env-variables", {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ envVariables: envVars }),
        });
        const envData = await envRes.json().catch(() => ({}));
        envOk = envRes.ok && envData.ok;
        envErr = envData?.error || "Env variables save failed.";
        if (envOk && Array.isArray(envData.envVariables)) {
          setEnvVars(
            envData.envVariables.map((e: any) => ({
              key: String(e?.key || ""),
              value: String(e?.value || ""),
            }))
          );
          setEnvError(null);
        }
      }

      if (webOk && envOk) {
        alert("Web Settings saved successfully!");
      } else if (webOk && !envOk) {
        alert("Web settings saved, but env variables failed: " + envErr);
      } else if (!webOk && envOk) {
        alert("Env variables saved, but web settings failed: " + (data.error || "Unknown error"));
      } else {
        alert("Failed to save: " + (data.error || envErr || "Unknown error"));
      }
    } catch {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(
    e: React.ChangeEvent<HTMLInputElement>,
    field: string
  ) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "web"); // stored in /public/uploads/livesoccerr/web
    // body.append("siteKey", "livesoccerr"); // optional; defaults already

    try {
      const res = await fetch("/api/admin/upload-file", { method: "POST", body });
      const data = await res.json();
      if (data.ok) {
        setFormData((prev) => ({ ...prev, [field]: data.url }));
      } else {
        alert("Upload failed: " + (data.error || "Unknown"));
      }
    } catch {
      alert("Error uploading file");
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  }

  if (loading) return <div className="p-10 text-secondary text-sm font-bold">Loading web settings...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      <div className="flex items-center justify-between sticky top-0 z-30 theme-bg py-4 border-b theme-border px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-black text-primary">Web Settings</h1>
          <p className="text-sm text-secondary">Manage theme, header, footer and socials (wired to Global SEO store).</p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-8">
        <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
            Visual Settings
          </h3>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="w-full md:w-48 space-y-2">
              <label className="text-xs font-bold text-secondary block">Theme Color</label>
              <div className="flex items-center gap-3">
                <input
                  type="color"
                  className="w-12 h-12 rounded-lg cursor-pointer border-none p-0 bg-transparent"
                  value={formData.themeColor}
                  onChange={(e) => setFormData({ ...formData, themeColor: e.target.value })}
                />
                <span className="text-sm font-mono text-primary uppercase font-bold">
                  {formData.themeColor}
                </span>
              </div>
            </div>

            <div className="flex-1 grid grid-cols-1 md:grid-cols-4 gap-6">
              <ImageUploadBox
                label="Header Logo"
                image={formData.headerLogo}
                uploading={uploadingField === "headerLogo"}
                onChange={(e: any) => handleFileUpload(e, "headerLogo")}
              />

              {/* ✅ NEW */}
              <ImageUploadBox
                label="Favicon"
                image={formData.favicon}
                uploading={uploadingField === "favicon"}
                onChange={(e: any) => handleFileUpload(e, "favicon")}
                helper="Browser tab icon (32x32 .ico/.png)"
              />

              <ImageUploadBox
                label="Footer Logo"
                image={formData.footerLogo}
                uploading={uploadingField === "footerLogo"}
                onChange={(e: any) => handleFileUpload(e, "footerLogo")}
              />

              <ImageUploadBox
                label="Placeholder Image"
                image={formData.placeholderImage}
                uploading={uploadingField === "placeholderImage"}
                onChange={(e: any) => handleFileUpload(e, "placeholderImage")}
                helper="Stored in Global SEO store (assets.placeholderImage)"
              />
            </div>
          </div>
        </div>

        <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
            Footer & Location
          </h3>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Footer Description</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary font-medium focus:ring-2 focus:ring-blue-500/50 resize-none h-32 placeholder:text-slate-500"
                  placeholder="Short description about your website..."
                  value={formData.footerDescription}
                  onChange={(e) => setFormData({ ...formData, footerDescription: e.target.value })}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-bold text-secondary block mb-1">Default Latitude</label>
                  <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2">
                    <MapPin size={14} className="text-secondary" />
                    <input
                      className="bg-transparent outline-none text-sm font-bold w-full text-primary"
                      placeholder="-23.2420"
                      value={formData.latitude}
                      onChange={(e) => setFormData({ ...formData, latitude: e.target.value })}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-bold text-secondary block mb-1">Default Longitude</label>
                  <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2">
                    <MapPin size={14} className="text-secondary" />
                    <input
                      className="bg-transparent outline-none text-sm font-bold w-full text-primary"
                      placeholder="-69.6669"
                      value={formData.longitude}
                      onChange={(e) => setFormData({ ...formData, longitude: e.target.value })}
                    />
                  </div>
                </div>
              </div>
            </div>

            <div className="space-y-6">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Google Map Iframe Link</label>
                <textarea
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm text-primary font-mono text-[11px] focus:ring-2 focus:ring-blue-500/50 resize-none h-32 placeholder:text-slate-500"
                  placeholder='<iframe src="https://www.google.com/maps/embed?..."></iframe>'
                  value={formData.googleMapUrl}
                  onChange={(e) => setFormData({ ...formData, googleMapUrl: e.target.value })}
                />
              </div>

              <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-white/5 border theme-border">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-blue-100 dark:bg-blue-500/10 text-blue-600 dark:text-blue-500 rounded-lg">
                    <Layout size={18} />
                  </div>
                  <div>
                    <h4 className="font-bold text-sm text-primary">Show Landing Page</h4>
                    <p className="text-[10px] text-secondary">Stored in Global SEO store (web.showLandingPage).</p>
                  </div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input
                    type="checkbox"
                    className="sr-only peer"
                    checked={formData.showLandingPage}
                    onChange={(e) => setFormData({ ...formData, showLandingPage: e.target.checked })}
                  />
                  <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                </label>
              </div>
            </div>
          </div>
        </div>

        <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
            Social Media Links
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            <SocialInput icon={Instagram} label="Instagram Link" value={formData.socialInstagram} onChange={(v: string) => setFormData({ ...formData, socialInstagram: v })} />
            <SocialInput icon={Monitor} label="X (Twitter) Link" value={formData.socialX} onChange={(v: string) => setFormData({ ...formData, socialX: v })} />
            <SocialInput icon={Facebook} label="Facebook Link" value={formData.socialFacebook} onChange={(v: string) => setFormData({ ...formData, socialFacebook: v })} />
            <SocialInput icon={Linkedin} label="Linkedin Link" value={formData.socialLinkedin} onChange={(v: string) => setFormData({ ...formData, socialLinkedin: v })} />
            <SocialInput icon={Globe} label="Pinterest Link" value={formData.socialPinterest} onChange={(v: string) => setFormData({ ...formData, socialPinterest: v })} />
          </div>
        </div>

        <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
          <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4 flex items-center justify-between">
            <span>Environment Variables (Main Website)</span>
            <button
              type="button"
              disabled={!envReady}
              onClick={() => {
                const idx = envVars.length;
                setEnvVars((p) => [...p, { key: "", value: "" }]);
                setRevealEnv((p) => ({ ...p, [idx]: true }));
              }}
              className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-[10px] font-bold disabled:opacity-40"
            >
              <Plus size={14} /> Add New
            </button>
          </h3>

          <p className="text-[11px] text-secondary opacity-80">
            Stored in admin DB and served to the main website. Use NEXT_PUBLIC_ for values that must be available in the browser.
          </p>

          {!envReady ? (
            <div className="text-xs text-secondary italic opacity-70">
              {envError || "Loading environment variables..."}
            </div>
          ) : envVars.length === 0 ? (
            <div className="text-center p-4 text-xs text-secondary italic opacity-70">
              No environment variables yet.
            </div>
          ) : (
            <div className="space-y-3">
              {envVars.map((item, index) => (
                <div key={index} className="flex gap-2 items-start group">
                  <div className="w-1/3">
                    <div className="theme-bg theme-border border rounded-lg px-2 py-1.5 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                      <input
                        className="bg-transparent outline-none text-xs font-bold w-full text-primary placeholder:text-slate-400 uppercase"
                        placeholder="KEY_NAME"
                        value={item.key}
                        onChange={(e) => {
                          const next = [...envVars];
                          next[index].key = normalizeKey(e.target.value);
                          setEnvVars(next);
                        }}
                      />
                    </div>
                  </div>

                  <div className="flex-1">
                    <div className="theme-bg theme-border border rounded-lg px-2 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                      <input
                        className="bg-transparent outline-none text-xs w-full text-secondary placeholder:text-slate-400"
                        placeholder="VALUE"
                        type={revealEnv[index] ? "text" : "password"}
                        value={item.value}
                        onChange={(e) => {
                          const next = [...envVars];
                          next[index].value = e.target.value;
                          setEnvVars(next);
                        }}
                      />
                      <button
                        type="button"
                        className="opacity-70 hover:opacity-100"
                        onClick={() => setRevealEnv((p) => ({ ...p, [index]: !p[index] }))}
                        title={revealEnv[index] ? "Hide" : "Show"}
                      >
                        {revealEnv[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => setEnvVars((p) => p.filter((_, i) => i !== index))}
                    className="p-2 rounded-lg theme-border border text-rose-500 hover:text-rose-400"
                    title="Remove"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function SocialInput({ icon: Icon, label, value, onChange }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-secondary block mb-1">{label}</label>
      <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
        <Icon size={14} className="text-secondary" />
        <input
          className="bg-transparent outline-none text-sm font-bold w-full text-primary placeholder:text-slate-500"
          placeholder="https://..."
          value={value}
          onChange={(e) => onChange(e.target.value)}
        />
      </div>
    </div>
  );
}

function ImageUploadBox({ label, image, uploading, onChange, helper }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-secondary block mb-2">{label}</label>
      <div className="relative border-2 border-dashed theme-border bg-slate-50 dark:bg-white/5 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all rounded-xl flex flex-col items-center justify-center group overflow-hidden h-32 w-full">
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
        ) : (
          <div className="text-center p-3">
            <div className="text-secondary font-bold text-xs">
              Drag & Drop or{" "}
              <span className="underline decoration-blue-500 text-blue-600 dark:text-blue-400">
                Browse
              </span>
            </div>
          </div>
        )}

        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-transparent">
          {uploading && (
            <div className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">
              Uploading...
            </div>
          )}
          <input type="file" className="hidden" accept="image/*,.ico" onChange={onChange} disabled={uploading} />
        </label>
      </div>
      {helper && <p className="text-[10px] text-secondary mt-1.5 opacity-70">{helper}</p>}
    </div>
  );
}
