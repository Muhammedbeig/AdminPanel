"use client";

import React, { useEffect, useState } from "react";
import { Save, Upload, Image as ImageIcon, Trash2 } from "lucide-react";

type SettingsData = {
  siteName: string;
  logoUrl: string;
};

export default function SettingsClient() {
  const [data, setData] = useState<SettingsData>({ siteName: "", logoUrl: "" });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  // 1. Fetch current settings on load
  useEffect(() => {
    fetch("/api/admin/config")
      .then((res) => res.json())
      .then((j) => {
        if (j.ok && j.data) {
          setData({
            siteName: j.data.siteName || "",
            logoUrl: j.data.logoUrl || "",
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  // 2. Save Changes
  async function handleSave() {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/config", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ data }),
      });

      if (res.ok) {
        // Reload page to refresh the Admin Header immediately
        window.location.reload();
      } else {
        alert("Failed to save settings");
        setSaving(false);
      }
    } catch (e) {
      console.error(e);
      setSaving(false);
      alert("Error saving settings");
    }
  }

  // 3. Handle Logo Upload (Updated URL)
  async function handleUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    formData.append("kind", "logo");

    try {
      // ✅ CHANGED: Uses the new unique API route to avoid "Server Action" conflicts
      const res = await fetch("/api/admin/upload-file", { 
        method: "POST", 
        body: formData 
      });
      
      // Read text first to prevent JSON.parse crashes
      const text = await res.text();
      let j;
      try {
        j = JSON.parse(text);
      } catch (err) {
        console.error("Server returned non-JSON:", text);
        alert("Server Error: " + text.substring(0, 100));
        setUploading(false);
        return;
      }
      
      if (j.ok) {
        setData({ ...data, logoUrl: j.url });
      } else {
        alert("Upload failed: " + j.error);
      }
    } catch (e: any) {
      console.error(e);
      alert("Upload error");
    } finally {
      setUploading(false);
      // Reset input so you can re-upload the same file if needed
      e.target.value = "";
    }
  }

  if (loading) {
    return <div className="p-8 text-secondary font-bold text-sm">Loading settings...</div>;
  }

  return (
    <div className="space-y-8 max-w-3xl">
      <div>
        {/* Header Title */}
        <h1 className="text-2xl font-black text-primary">Admin Settings</h1>
        <p className="text-sm text-secondary">Customize the branding of your admin panel.</p>
      </div>

      {/* Main Form Container */}
      <div className="theme-bg theme-border border rounded-xl p-6 space-y-8">
        
        {/* --- SITE NAME --- */}
        <div>
          <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-2">
            Panel Name
          </label>
          <input
            className="w-full theme-bg theme-border border rounded-xl px-4 py-3 font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            value={data.siteName}
            onChange={(e) => setData({ ...data, siteName: e.target.value })}
            placeholder="LiveSocceRR Admin"
          />
          <p className="text-[11px] text-secondary mt-2 opacity-70">
            This name appears in the top header and browser tab.
          </p>
        </div>

        {/* --- LOGO UPLOAD --- */}
        <div>
          <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-2">
            Panel Logo
          </label>
          
          <div className="flex flex-col sm:flex-row items-start gap-6">
            {/* Logo Preview Box */}
            <div className="w-32 h-32 theme-bg theme-border border-2 border-dashed rounded-xl flex items-center justify-center overflow-hidden relative group shrink-0">
              {data.logoUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img 
                  src={data.logoUrl} 
                  alt="Logo Preview" 
                  className="w-full h-full object-contain p-2" 
                />
              ) : (
                <ImageIcon className="text-secondary opacity-30" size={32} />
              )}
              
              {uploading && (
                <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white text-[10px] font-black uppercase tracking-widest">
                  Uploading...
                </div>
              )}
            </div>

            {/* Controls */}
            <div className="flex-1 space-y-3 pt-1">
               {/* Upload Button: Visible in Light (slate-900) and Dark (white) */}
               <label className="cursor-pointer inline-flex items-center gap-2 px-4 py-2 bg-slate-200 dark:bg-slate-800 hover:bg-slate-300 dark:hover:bg-slate-700 rounded-lg font-bold text-sm text-slate-900 dark:text-white transition-colors">
                 <Upload size={16} />
                 <span>Upload New Image</span>
                 <input 
                    type="file" 
                    className="hidden" 
                    accept="image/png, image/jpeg, image/webp, image/svg+xml" 
                    onChange={handleUpload} 
                    disabled={uploading}
                 />
               </label>
               
               <p className="text-xs text-secondary leading-relaxed max-w-sm">
                 Recommended size: <strong>200x200px</strong> (Square). <br/>
                 Formats: PNG, JPG, WEBP, SVG.
               </p>

               {data.logoUrl && (
                 <button 
                   onClick={() => setData({ ...data, logoUrl: "" })}
                   className="text-xs text-red-500 font-bold hover:text-red-600 flex items-center gap-1 transition-colors"
                 >
                   <Trash2 size={12} />
                   Remove Logo
                 </button>
               )}
            </div>
          </div>
        </div>

        {/* --- SAVE BUTTON --- */}
        <div className="pt-6 border-t theme-border flex justify-end">
          <button
            onClick={handleSave}
            disabled={saving || uploading}
            className="px-8 py-3 bg-[#0f80da] hover:opacity-90 text-white rounded-xl font-bold flex items-center gap-2 transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-blue-500/20"
          >
            <Save size={18} />
            {saving ? "Saving & Reloading..." : "Save Changes"}
          </button>
        </div>

      </div>
    </div>
  );
}