"use client";

import React, { useEffect, useState } from "react";
import { 
  Save, Upload, Mail, Phone, MapPin, 
  Monitor, AlertCircle, Layout, Globe
} from "lucide-react";

export default function SettingsClient() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploadingField, setUploadingField] = useState<string | null>(null);

  // Form State
  const [formData, setFormData] = useState({
    logo: "",
    favicon: "",
    siteName: "", // Maps to "Company Name"
    supportEmail: "",
    contactNumber: "",
    address: "",
    defaultLanguage: "en",
    timezone: "UTC",
    maintenanceMode: false,
    googleAnalyticsId: "",
  });

  // 1. Fetch settings on load
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((j) => {
        if (j.ok && j.settings) {
          setFormData(prev => ({ 
            ...prev, 
            ...j.settings,
            logo: j.settings.logo || "",
            favicon: j.settings.favicon || "",
            siteName: j.settings.siteName || "",
            supportEmail: j.settings.supportEmail || "",
            contactNumber: j.settings.contactNumber || "",
            address: j.settings.address || "",
            googleAnalyticsId: j.settings.googleAnalyticsId || "",
            maintenanceMode: j.settings.maintenanceMode ?? false, 
          }));
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Real-time Preview (Favicon & Title)
  useEffect(() => {
    // Update Favicon
    if (formData.favicon) {
      let link: HTMLLinkElement | null = document.querySelector("link[rel~='icon']");
      if (!link) {
        link = document.createElement('link');
        link.rel = 'icon';
        document.getElementsByTagName('head')[0].appendChild(link);
      }
      link.href = formData.favicon;
    }

    // ✅ Update Browser Tab Title Instantly
    // This shows how it will look: "Page Name || Company Name"
    if (formData.siteName) {
      document.title = `General Settings || ${formData.siteName}`;
    }
  }, [formData.favicon, formData.siteName]);

  // 3. Save Settings
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/settings", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const data = await res.json();

      if (data.ok) {
        alert("Settings saved successfully!");
        window.location.reload(); // Reload to update Header/Sidebar logo
      } else {
        alert("Failed to save: " + data.error);
      }
    } catch (e) {
      alert("Error saving settings");
    } finally {
      setSaving(false);
    }
  }

  // 4. Handle File Upload
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
      if (data.ok) {
        setFormData(prev => ({ ...prev, [field]: data.url }));
      } else {
        alert("Upload failed");
      }
    } catch (error) {
      alert("Error uploading file");
    } finally {
      setUploadingField(null);
      e.target.value = "";
    }
  }

  if (loading) return <div className="p-10 text-secondary text-sm font-bold">Loading configuration...</div>;

  return (
    <div className="max-w-7xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between sticky top-0 z-30 theme-bg py-4 border-b theme-border px-4 md:px-0">
        <div>
          <h1 className="text-2xl font-black text-primary">General Settings</h1>
          <p className="text-sm text-secondary">Manage system branding and configurations.</p>
        </div>
        <button 
          onClick={handleSave}
          disabled={saving}
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
        >
          <Save size={16} /> {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">

        {/* --- LEFT COLUMN: BRANDING & SYSTEM --- */}
        <div className="space-y-8">
          
          {/* BRANDING IMAGES */}
          <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
              Branding Images
            </h3>
            
            <div className="space-y-6">
              {/* Logo */}
              <ImageUploadBox 
                label="Company Logo"
                image={formData.logo}
                uploading={uploadingField === "logo"}
                onChange={(e: any) => handleFileUpload(e, "logo")}
                helper="Visible on Sidebar & Header. Recommended: 200x50px."
              />

              {/* Favicon */}
              <div className="w-full">
                <ImageUploadBox 
                  label="Favicon Icon"
                  image={formData.favicon}
                  uploading={uploadingField === "favicon"}
                  onChange={(e: any) => handleFileUpload(e, "favicon")}
                  helper="Browser tab icon (32x32)."
                  isSquare
                />
              </div>
            </div>
          </div>

          {/* SYSTEM CONFIGURATION */}
          <div className="theme-bg theme-border border rounded-xl p-6 space-y-6">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
              More Settings
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Default Language</label>
                <div className="relative">
                  <Globe size={16} className="absolute left-3 top-2.5 text-secondary pointer-events-none" />
                  <select 
                    className="w-full pl-10 pr-3 py-2 rounded-lg theme-bg theme-border border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 appearance-none"
                    value={formData.defaultLanguage}
                    onChange={e => setFormData({ ...formData, defaultLanguage: e.target.value })}
                  >
                    <option value="en">English (US)</option>
                    <option value="es">Spanish</option>
                    <option value="fr">French</option>
                    <option value="ar">Arabic</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Timezone</label>
                <select 
                  className="w-full px-3 py-2 rounded-lg theme-bg theme-border border text-sm font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50"
                  value={formData.timezone}
                  onChange={e => setFormData({ ...formData, timezone: e.target.value })}
                >
                  <option value="UTC">UTC (Universal)</option>
                  <option value="GMT">GMT (London)</option>
                  <option value="EST">EST (New York)</option>
                  <option value="PKT">PKT (Pakistan)</option>
                </select>
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Google Analytics ID</label>
              <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                <Layout size={16} className="text-secondary" />
                <input 
                  className="bg-transparent outline-none text-sm w-full text-primary placeholder:text-slate-500"
                  placeholder="G-XXXXXXXXXX"
                  value={formData.googleAnalyticsId}
                  onChange={e => setFormData({...formData, googleAnalyticsId: e.target.value})}
                />
              </div>
            </div>

            {/* MAINTENANCE MODE: RED WARNING STYLE */}
            <div className="flex items-center justify-between p-4 rounded-lg bg-slate-50 dark:bg-white/5 border theme-border">
              <div className="flex items-center gap-3">
                {/* Red Icon for Danger */}
                <div className="p-2 rounded-lg bg-red-50 text-red-600 dark:bg-red-500/10 dark:text-red-500">
                  <AlertCircle size={18} />
                </div>
                <div>
                  <h4 className="font-bold text-sm text-primary">Maintenance Mode</h4>
                  <p className="text-[10px] text-secondary">Disable frontend access for visitors.</p>
                </div>
              </div>
              <label className="relative inline-flex items-center cursor-pointer">
                <input 
                  type="checkbox" 
                  className="sr-only peer"
                  checked={formData.maintenanceMode}
                  onChange={e => setFormData({...formData, maintenanceMode: e.target.checked})}
                />
                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600 dark:peer-checked:bg-red-500"></div>
              </label>
            </div>

          </div>
        </div>

        {/* --- RIGHT COLUMN: COMPANY DETAILS --- */}
        <div className="space-y-8">
          <div className="theme-bg theme-border border rounded-xl p-6 space-y-6 h-full">
            <h3 className="text-xs font-black text-secondary uppercase tracking-widest border-b theme-border pb-3 mb-4">
              Company Details
            </h3>

            <div className="space-y-5">
              {/* ✅ Company Name (Controls Text next to Logo & Browser Title) */}
              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Company Name <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <Monitor size={16} className="text-secondary" />
                  <input 
                    className="bg-transparent outline-none text-sm font-bold w-full text-primary placeholder:text-slate-500"
                    placeholder="e.g. LiveScorePro"
                    value={formData.siteName}
                    onChange={e => setFormData({...formData, siteName: e.target.value})}
                  />
                </div>
                <p className="text-[10px] text-secondary mt-1 ml-1 opacity-70">
                  Visible next to the Logo and used in Browser Tabs (e.g. "Settings || {formData.siteName || 'Company Name'}").
                </p>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Email <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <Mail size={16} className="text-secondary" />
                  <input 
                    className="bg-transparent outline-none text-sm font-bold w-full text-primary placeholder:text-slate-500"
                    placeholder="admin@yoursite.com"
                    value={formData.supportEmail}
                    onChange={e => setFormData({...formData, supportEmail: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Contact Number <span className="text-red-500">*</span></label>
                <div className="flex items-center gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <Phone size={16} className="text-secondary" />
                  <input 
                    className="bg-transparent outline-none text-sm font-bold w-full text-primary placeholder:text-slate-500"
                    placeholder="+1 234 567 890"
                    value={formData.contactNumber}
                    onChange={e => setFormData({...formData, contactNumber: e.target.value})}
                  />
                </div>
              </div>

              <div>
                <label className="text-xs font-bold text-secondary block mb-1">Address</label>
                <div className="flex gap-2 theme-bg theme-border border rounded-lg px-3 py-2 focus-within:ring-2 focus-within:ring-blue-500/50 transition-all">
                  <MapPin size={16} className="text-secondary mt-1" />
                  <textarea 
                    className="bg-transparent outline-none text-sm font-bold w-full text-primary placeholder:text-slate-500 h-24 resize-none"
                    placeholder="123 Stadium Ave, Sports City..."
                    value={formData.address}
                    onChange={e => setFormData({...formData, address: e.target.value})}
                  />
                </div>
              </div>
            </div>

            {/* Note Box: Perfect Blue */}
            <div className="bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-500 dark:border-blue-500/30 p-4 rounded-xl text-xs">
              <strong>Note:</strong> These details will be visible on the "Contact Us" page and email footers.
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

// --- HELPER COMPONENT: DRAG & DROP IMAGE UPLOADER ---
function ImageUploadBox({ label, image, uploading, onChange, helper, isSquare }: any) {
  return (
    <div>
      <label className="text-xs font-bold text-secondary block mb-2">{label}</label>
      {/* PERFECT BLUE HOVER */}
      <div className={`relative border-2 border-dashed theme-border bg-slate-50 dark:bg-white/5 hover:border-blue-600 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-500/10 transition-all rounded-xl flex flex-col items-center justify-center group overflow-hidden ${isSquare ? "aspect-square w-full sm:w-40" : "h-24 w-full"}`}>
        
        {image ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={image} alt="Preview" className="w-full h-full object-contain p-2" />
        ) : (
          <div className="text-center p-3">
             <div className="text-secondary font-bold text-xs">
               Drag & Drop or <span className="underline decoration-blue-500 text-blue-600 dark:text-blue-400">Browse</span>
             </div>
          </div>
        )}
        
        {/* Clickable Overlay */}
        <label className="absolute inset-0 cursor-pointer flex items-center justify-center bg-transparent">
          {uploading && (
             <div className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded">Uploading...</div>
          )}
          <input type="file" className="hidden" accept="image/*" onChange={onChange} disabled={uploading} />
        </label>
      </div>
      {helper && <p className="text-[10px] text-secondary mt-1.5 opacity-70">{helper}</p>}
    </div>
  );
}