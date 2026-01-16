"use client";

import React, { useEffect, useMemo, useState } from "react";
import {
  Save,
  Upload,
  Mail,
  Phone,
  MapPin,
  Monitor,
  AlertCircle,
  Layout,
  Globe,
  Plus,
  Trash2,
  Key,
  Eye,
  EyeOff,
  Pencil,
} from "lucide-react";

type EnvVar = { key: string; value: string };

type SystemEnvItem = {
  key: string;
  isSet: boolean;
  displayValue: string; // masked for secrets
  source: "env";
  masked: boolean;
  overriddenByCustom?: boolean;
  activeSource?: "env" | "db";
  // only present when NOT masked (safe to prefill)
  activeValue?: string;
};

function normalizeKey(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");
}

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  const [systemEnv, setSystemEnv] = useState<SystemEnvItem[]>([]);
  const [envVars, setEnvVars] = useState<EnvVar[]>([]);
  const [revealCustom, setRevealCustom] = useState<Record<number, boolean>>({});

  const [formData, setFormData] = useState({
    logo: "",
    favicon: "",
    siteName: "",
    supportEmail: "",
    contactNumber: "",
    address: "",
    defaultLanguage: "en",
    timezone: "UTC",
    maintenanceMode: false,
    googleAnalyticsId: "",
  });

  // Fetch settings on load
  useEffect(() => {
    fetch("/api/admin/settings", { cache: "no-store" })
      .then((res) => res.json())
      .then((j) => {
        if (j?.ok) {
          const s = j.settings || {};

          setFormData((prev) => ({
            ...prev,
            ...s,
            logo: s.logo || "",
            favicon: s.favicon || "",
            siteName: s.siteName || "",
            supportEmail: s.supportEmail || "",
            contactNumber: s.contactNumber || "",
            address: s.address || "",
            googleAnalyticsId: s.googleAnalyticsId || "",
            maintenanceMode: s.maintenanceMode ?? false,
          }));

          if (Array.isArray(j.systemEnv)) setSystemEnv(j.systemEnv);

          if (Array.isArray(s.envVariables)) {
            setEnvVars(
              s.envVariables
                .map((e: any) => ({
                  key: String(e?.key || ""),
                  value: String(e?.value || ""),
                }))
                .filter((x: EnvVar) => x.key && x.value)
            );
          } else {
            setEnvVars([]);
          }
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // preview update
  useEffect(() => {
    if (formData.favicon) {
      let link = document.querySelector("link[rel*='icon']") as HTMLLinkElement | null;
      if (!link) {
        link = document.createElement("link");
        link.rel = "shortcut icon";
        document.head.appendChild(link);
      }
      link.href = formData.favicon;
    }
    if (formData.siteName) {
      document.title = `General Settings || ${formData.siteName}`;
    }
  }, [formData.favicon, formData.siteName]);

  const customIndexByKey = useMemo(() => {
    const m = new Map<string, number>();
    envVars.forEach((v, idx) => {
      const k = normalizeKey(v.key);
      if (k) m.set(k, idx);
    });
    return m;
  }, [envVars]);

  const systemKeySet = useMemo(() => new Set(systemEnv.map((x) => normalizeKey(x.key))), [systemEnv]);

  async function refresh() {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const j = await res.json();
      if (j?.ok) {
        const s = j.settings || {};
        if (Array.isArray(j.systemEnv)) setSystemEnv(j.systemEnv);
        if (Array.isArray(s.envVariables)) {
          setEnvVars(
            s.envVariables
              .map((e: any) => ({ key: String(e?.key || ""), value: String(e?.value || "") }))
              .filter((x: EnvVar) => x.key && x.value)
          );
        } else {
          setEnvVars([]);
        }
      }
    } catch {
      // ignore
    }
  }

  async function handleSave() {
    setSaving(true);
    try {
      const payload = {
        ...formData,
        envVariables: envVars
          .map((e) => ({ key: normalizeKey(e.key), value: String(e.value || "") }))
          .filter((e) => e.key && e.value)
          // IMPORTANT: never save masked placeholders
          .filter((e) => !String(e.value).includes("•")),
      };

      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json().catch(() => null);
        if (data?.ok) {
          alert("✅ Settings saved");
          await refresh();
          if (typeof window !== "undefined") {
            window.dispatchEvent(
              new CustomEvent("admin-settings-updated", { detail: { settings: data.settings } })
            );
            try {
              localStorage.setItem("admin-settings-updated", String(Date.now()));
            } catch {
              // ignore storage failures
            }
          }
        } else {
          alert(data?.error || "❌ Failed to save settings");
        }
    } catch {
      alert("❌ Failed to save settings");
    } finally {
      setSaving(false);
    }
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>, field: string) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploadingField(field);

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "branding");

    try {
      const res = await fetch("/api/admin/upload-file", { method: "POST", body });
      const data = await res.json();
      if (data?.ok) {
        setFormData((prev) => ({ ...prev, [field]: data.url }));
      } else {
        alert("Upload failed");
      }
    } catch {
      alert("Error uploading file");
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  }

  function startOverride(keyRaw: string) {
    const key = normalizeKey(keyRaw);
    if (!key) return;

    const existingIndex = customIndexByKey.get(key);
    if (existingIndex !== undefined) {
      setRevealCustom((p) => ({ ...p, [existingIndex]: true }));
      return;
    }

    const sys = systemEnv.find((x) => normalizeKey(x.key) === key);

    // CRITICAL: do NOT prefill masked values (••••1234) into editable DB keys
    const prefillValue = sys && !sys.masked ? String(sys.activeValue || "") : "";

    const newIndex = envVars.length;
    setEnvVars((p) => [...p, { key, value: prefillValue }]);
    setRevealCustom((p) => ({ ...p, [newIndex]: true }));
  }

  if (loading) return <div className="p-10 text-secondary text-sm font-bold">Loading configuration...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8">
      {/* HEADER */}
      <div className="theme-bg theme-border border rounded-xl p-6 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-black text-primary">Settings</h1>
          <p className="text-xs text-secondary font-semibold mt-1">Branding, contact, and app configuration.</p>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="px-4 py-2 rounded-lg bg-blue-600 text-white text-xs font-black flex items-center gap-2 disabled:opacity-60"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      {/* BRANDING */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Logo */}
        <div className="theme-bg theme-border border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <Layout size={16} /> Header Logo
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-lg theme-border border overflow-hidden bg-black/5">
              {formData.logo ? <img src={formData.logo} alt="logo" className="w-full h-full object-contain" /> : null}
            </div>

            <div className="space-y-2 w-full">
              <input
                className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
                value={formData.logo}
                placeholder="Logo URL..."
                onChange={(e) => setFormData((p) => ({ ...p, logo: e.target.value }))}
              />

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg theme-border border text-xs font-black cursor-pointer hover:bg-black/5 transition-colors">
                <Upload size={14} />
                {uploadingField === "logo" ? "Uploading..." : "Upload"}
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "logo")} />
              </label>
            </div>
          </div>
        </div>

        {/* Favicon */}
        <div className="theme-bg theme-border border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <Monitor size={16} /> Favicon
          </div>

          <div className="flex gap-3 items-center">
            <div className="w-16 h-16 rounded-lg theme-border border overflow-hidden bg-black/5">
              {formData.favicon ? (
                <img src={formData.favicon} alt="favicon" className="w-full h-full object-contain" />
              ) : null}
            </div>

            <div className="space-y-2 w-full">
              <input
                className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
                value={formData.favicon}
                placeholder="Favicon URL..."
                onChange={(e) => setFormData((p) => ({ ...p, favicon: e.target.value }))}
              />

              <label className="inline-flex items-center gap-2 px-3 py-2 rounded-lg theme-border border text-xs font-black cursor-pointer hover:bg-black/5 transition-colors">
                <Upload size={14} />
                {uploadingField === "favicon" ? "Uploading..." : "Upload"}
                <input type="file" className="hidden" onChange={(e) => handleFileUpload(e, "favicon")} />
              </label>
            </div>
          </div>
        </div>
      </div>

      {/* CONTACT / BASIC */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="theme-bg theme-border border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <Globe size={16} /> Site Details
          </div>

          <input
            className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
            value={formData.siteName}
            placeholder="Site Name"
            onChange={(e) => setFormData((p) => ({ ...p, siteName: e.target.value }))}
          />

          <div className="flex gap-2 items-center">
            <Mail size={16} className="opacity-60" />
            <input
              className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
              value={formData.supportEmail}
              placeholder="Support Email"
              onChange={(e) => setFormData((p) => ({ ...p, supportEmail: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 items-center">
            <Phone size={16} className="opacity-60" />
            <input
              className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
              value={formData.contactNumber}
              placeholder="Contact Number"
              onChange={(e) => setFormData((p) => ({ ...p, contactNumber: e.target.value }))}
            />
          </div>

          <div className="flex gap-2 items-center">
            <MapPin size={16} className="opacity-60" />
            <input
              className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
              value={formData.address}
              placeholder="Address"
              onChange={(e) => setFormData((p) => ({ ...p, address: e.target.value }))}
            />
          </div>
        </div>

        <div className="theme-bg theme-border border rounded-xl p-6 space-y-4">
          <div className="flex items-center gap-2 text-primary font-black text-sm">
            <AlertCircle size={16} /> App Config
          </div>

          <input
            className="text-xs w-full theme-border border rounded-lg px-3 py-2 bg-transparent"
            value={formData.googleAnalyticsId}
            placeholder="Google Analytics ID (optional)"
            onChange={(e) => setFormData((p) => ({ ...p, googleAnalyticsId: e.target.value }))}
          />

          <label className="flex items-center gap-3 text-xs font-bold text-secondary">
            <input
              type="checkbox"
              checked={formData.maintenanceMode}
              onChange={(e) => setFormData((p) => ({ ...p, maintenanceMode: e.target.checked }))}
            />
            Maintenance Mode
          </label>

          <p className="text-[11px] text-secondary opacity-80">
            Hosting/.env keys are read-only in UI. Use “Custom Keys (DB)” to override active values.
          </p>
        </div>
      </div>

      {/* API KEYS & CONFIGS */}
      <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
        <h3 className="text-xs font-black text-secondary uppercase tracking-wider border-b theme-border pb-3 flex items-center justify-between">
          <span className="flex items-center gap-2">
            <Key size={14} /> API Keys & Configs
          </span>

          <button
            onClick={() => {
              const idx = envVars.length;
              setEnvVars((p) => [...p, { key: "", value: "" }]);
              setRevealCustom((p) => ({ ...p, [idx]: true }));
            }}
            className="text-blue-600 hover:text-blue-500 flex items-center gap-1 text-[10px] font-bold"
          >
            <Plus size={14} /> Add New
          </button>
        </h3>

        {/* System env (read-only) */}
        <div className="space-y-3">
          <div className="text-[11px] font-black text-primary uppercase tracking-wide opacity-80">
            System Environment (.env / hosting)
          </div>

          {systemEnv.length === 0 ? (
            <div className="text-xs text-secondary italic opacity-70">No environment keys detected.</div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
              {systemEnv.map((k) => (
                <div key={k.key} className="theme-border border rounded-lg px-3 py-2 flex items-center justify-between">
                  <div className="min-w-0">
                    <div className="text-[11px] font-black text-primary truncate">{k.key}</div>
                    <div className="text-[11px] text-secondary truncate">{k.isSet ? k.displayValue : "Not set"}</div>
                  </div>
                  <div className="flex items-center gap-2">
                    {k.overriddenByCustom ? (
                      <span className="text-[10px] font-black px-2 py-1 rounded bg-amber-500/15 text-amber-600">
                        overridden
                      </span>
                    ) : null}
                    <span
                      className={`text-[10px] font-black px-2 py-1 rounded ${
                        k.isSet ? "bg-emerald-500/15 text-emerald-600" : "bg-rose-500/15 text-rose-600"
                      }`}
                    >
                      {k.isSet ? "set" : "missing"}
                    </span>
                    <button
                      type="button"
                      onClick={() => startOverride(k.key)}
                      className="text-[10px] font-black px-2 py-1 rounded theme-border border hover:bg-black/5 inline-flex items-center gap-1"
                      title="Override via DB"
                    >
                      <Pencil size={12} />
                      {k.overriddenByCustom ? "Edit" : "Override"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Custom keys (editable, stored in DB) */}
        <div className="space-y-3 pt-2">
          <div className="text-[11px] font-black text-primary uppercase tracking-wide opacity-80">Custom Keys (DB)</div>

          {envVars.length === 0 && (
            <div className="text-center p-4 text-xs text-secondary italic opacity-70">No custom keys added yet.</div>
          )}

          {envVars.map((item, index) => {
            const key = normalizeKey(item.key);
            const matchesSystem = key && systemKeySet.has(key);

            return (
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

                  {matchesSystem ? (
                    <div className="text-[10px] text-amber-600 font-bold mt-1">Overrides system key</div>
                  ) : null}
                </div>

                <div className="flex-1">
                  <div className="theme-bg theme-border border rounded-lg px-2 py-1.5 flex items-center gap-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                    <input
                      className="bg-transparent outline-none text-xs w-full text-secondary placeholder:text-slate-400"
                      placeholder="VALUE"
                      type={revealCustom[index] ? "text" : "password"}
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
                      onClick={() => setRevealCustom((p) => ({ ...p, [index]: !p[index] }))}
                      title={revealCustom[index] ? "Hide" : "Show"}
                    >
                      {revealCustom[index] ? <EyeOff size={16} /> : <Eye size={16} />}
                    </button>
                  </div>

                  {String(item.value || "").includes("•") ? (
                    <div className="text-[10px] text-rose-500 font-bold mt-1">
                      Masked values cannot be saved. Please type the real value.
                    </div>
                  ) : null}
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
            );
          })}
        </div>
      </div>
    </div>
  );
}
