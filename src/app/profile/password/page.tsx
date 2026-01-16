"use client";

import React, { useState } from "react";
import { Lock } from "lucide-react";

export default function ChangePasswordPage() {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  const handleChange = async () => {
    if (formData.newPassword !== formData.confirmPassword) {
      alert("New passwords do not match!");
      return;
    }
    
    setLoading(true);
    try {
      const res = await fetch("/api/admin/profile/password", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData)
      });
      const data = await res.json();
      
      if (data.ok) {
        alert("Password changed successfully!");
        setFormData({ currentPassword: "", newPassword: "", confirmPassword: "" });
      } else {
        alert("Error: " + data.error);
      }
    } catch (e) {
      alert("Failed to change password");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto py-10 animate-in fade-in duration-500">
      <div className="theme-bg theme-border border rounded-xl shadow-sm overflow-hidden">
        
        <div className="p-6 border-b theme-border text-center">
          <h1 className="text-xl font-bold text-primary">Change Password</h1>
        </div>

        <div className="p-8 space-y-6">
          
          <div className="space-y-4 max-w-lg mx-auto">
            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Current Password</label>
              <div className="flex items-center gap-2 border theme-border rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/50">
                 <Lock size={16} className="text-secondary" />
                 <input 
                   type="password"
                   className="w-full bg-transparent outline-none text-sm font-bold text-primary"
                   value={formData.currentPassword}
                   onChange={e => setFormData({...formData, currentPassword: e.target.value})}
                 />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">New Password</label>
              <div className="flex items-center gap-2 border theme-border rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/50">
                 <Lock size={16} className="text-secondary" />
                 <input 
                   type="password"
                   className="w-full bg-transparent outline-none text-sm font-bold text-primary"
                   value={formData.newPassword}
                   onChange={e => setFormData({...formData, newPassword: e.target.value})}
                 />
              </div>
            </div>

            <div>
              <label className="text-xs font-bold text-secondary block mb-1">Confirm New Password</label>
              <div className="flex items-center gap-2 border theme-border rounded-lg px-3 py-2 bg-slate-50 dark:bg-white/5 focus-within:ring-2 focus-within:ring-blue-500/50">
                 <Lock size={16} className="text-secondary" />
                 <input 
                   type="password"
                   className="w-full bg-transparent outline-none text-sm font-bold text-primary"
                   value={formData.confirmPassword}
                   onChange={e => setFormData({...formData, confirmPassword: e.target.value})}
                 />
              </div>
            </div>
          </div>

          <div className="flex justify-center pt-4">
             <button 
               onClick={handleChange}
               disabled={loading}
               className="px-8 py-2.5 bg-[#00A9B4] hover:bg-[#009ca6] text-white rounded-md font-bold text-sm shadow-md transition-all flex items-center gap-2"
             >
               {loading ? "Changing..." : "Change Password"}
             </button>
          </div>

        </div>
      </div>
    </div>
  );
}