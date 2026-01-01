"use client";

import React, { useEffect, useState } from "react";
import { User, Upload } from "lucide-react";

export default function ProfilePage() {
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    image: ""
  });

  // Fetch Current Profile
  useEffect(() => {
    fetch("/api/admin/profile")
      .then(res => res.json())
      .then(data => {
        if (data.ok && data.user) {
          setFormData({
            name: data.user.name || "",
            email: data.user.email || "",
            image: data.user.image || ""
          });
        }
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/admin/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      if (data.ok) {
        alert("Profile updated successfully!");
        window.location.reload(); // Reload to reflect changes in header
      } else {
        alert(data.error);
      }
    } catch (e) {
      alert("Error saving profile");
    } finally {
      setSaving(false);
    }
  };

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const body = new FormData();
    body.append("file", file);
    body.append("kind", "avatar");

    try {
      const res = await fetch("/api/admin/upload-file", { method: "POST", body });
      const data = await res.json();
      if (data.ok) {
        setFormData(prev => ({ ...prev, image: data.url }));
      }
    } catch (error) {
      alert("Error uploading image");
    }
  };

  if (loading) return <div className="p-10 text-center text-secondary font-bold">Loading profile...</div>;

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="theme-bg theme-border border rounded-xl shadow-sm overflow-hidden">
        
        {/* Header */}
        <div className="p-6 border-b theme-border text-center">
          <h1 className="text-xl font-bold text-primary">Change Profile</h1>
        </div>

        <div className="p-8 space-y-8">
          
          {/* Profile Image Row */}
          <div className="flex flex-col md:flex-row items-center gap-8 justify-center md:justify-start">
            <div className="w-32 text-center md:text-right md:w-1/4 font-bold text-secondary text-sm">Profile</div>
            <div className="flex items-center gap-4">
              <div className="w-24 h-24 rounded-xl overflow-hidden bg-slate-100 dark:bg-white/5 border theme-border relative group">
                {formData.image ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={formData.image} alt="Profile" className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center">
                    <User className="text-secondary opacity-30" size={32} />
                  </div>
                )}
              </div>
              <label className="px-4 py-2 border theme-border rounded-lg text-xs font-bold text-secondary hover:text-blue-600 hover:border-blue-500 cursor-pointer transition-colors bg-slate-50 dark:bg-transparent shadow-sm">
                Browse File
                <input type="file" className="hidden" accept="image/*" onChange={handleFileUpload} />
              </label>
            </div>
          </div>

          {/* Name Field */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="w-full md:w-1/4 font-bold text-secondary text-sm text-left md:text-right">Name</div>
            <div className="flex-1 w-full">
              <input 
                className="w-full px-4 py-2.5 rounded-lg border theme-border bg-slate-50 dark:bg-white/5 text-sm text-primary font-bold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
                value={formData.name}
                onChange={e => setFormData({...formData, name: e.target.value})}
              />
            </div>
          </div>

          {/* Email Field */}
          <div className="flex flex-col md:flex-row items-center gap-4 md:gap-8">
            <div className="w-full md:w-1/4 font-bold text-secondary text-sm text-left md:text-right">Email</div>
            <div className="flex-1 w-full">
              <input 
                className="w-full px-4 py-2.5 rounded-lg border theme-border bg-slate-100 dark:bg-white/10 text-sm text-secondary font-bold outline-none cursor-not-allowed opacity-70"
                value={formData.email}
                disabled
                title="Email cannot be changed"
              />
            </div>
          </div>

          {/* Submit Button */}
          <div className="flex justify-end pt-4">
             <button 
               onClick={handleSave}
               disabled={saving}
               className="px-8 py-2.5 bg-[#00A9B4] hover:bg-[#009ca6] text-white rounded-md font-bold text-sm shadow-md transition-all flex items-center gap-2"
             >
               {saving ? "Saving..." : "Change"}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}