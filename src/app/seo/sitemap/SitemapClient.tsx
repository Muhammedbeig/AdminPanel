"use client";

import React, { useEffect, useState } from "react";
import { 
  ExternalLink, CheckCircle2, FileJson, Settings, 
  Plus, Trash2, Link as LinkIcon, ChevronDown, Save
} from "lucide-react";

export default function SitemapClient() {
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const sitemapUrl = `${baseUrl}/sitemap.xml`;

  // Custom Links State
  const [links, setLinks] = useState<any[]>([]);
  const [newPath, setNewPath] = useState("");
  const [newPriority, setNewPriority] = useState("0.7");
  const [loading, setLoading] = useState(false);

  // Global Priorities State
  const [globalSettings, setGlobalSettings] = useState({ home: "1.0", posts: "0.9", pages: "0.8" });
  const [savingSettings, setSavingSettings] = useState(false);

  const fetchData = async () => {
    // Fetch Links
    fetch("/api/admin/seo/sitemap/links").then(r => r.json()).then(d => { if(d.ok) setLinks(d.links) });
    // Fetch Settings
    fetch("/api/admin/seo/sitemap/settings").then(r => r.json()).then(d => {
      if(d.ok && d.settings) {
        setGlobalSettings({
          home: d.settings.homePriority.toString(),
          posts: d.settings.postPriority.toString(),
          pages: d.settings.pagePriority.toString()
        });
      }
    });
  };

  useEffect(() => { fetchData(); }, []);

  const handleSaveSettings = async () => {
    setSavingSettings(true);
    await fetch("/api/admin/seo/sitemap/settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify(globalSettings)
    });
    setSavingSettings(false);
    alert("Global priorities updated!");
  };

  const handleAddLink = async () => {
    if (!newPath.startsWith("/")) { alert("Path must start with /"); return; }
    setLoading(true);
    await fetch("/api/admin/seo/sitemap/links", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ path: newPath, priority: newPriority, frequency: "weekly" })
    });
    setNewPath("");
    fetchData();
    setLoading(false);
  };

  const handleDeleteLink = async (id: number) => {
    if(!confirm("Delete link?")) return;
    await fetch("/api/admin/seo/sitemap/links", { method: "DELETE", body: JSON.stringify({ id }) });
    fetchData();
  };

  const PrioritySelect = ({ value, onChange }: { value: string, onChange: (v: string) => void }) => (
    <div className="relative w-full">
      <select 
        className="w-full appearance-none px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 text-sm cursor-pointer"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        <option value="1.0">1.0 (Highest)</option>
        <option value="0.9">0.9</option>
        <option value="0.8">0.8</option>
        <option value="0.7">0.7</option>
        <option value="0.6">0.6</option>
        <option value="0.5">0.5 (Lowest)</option>
      </select>
      <ChevronDown size={14} className="absolute right-3 top-1/2 -translate-y-1/2 text-secondary pointer-events-none" />
    </div>
  );

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <FileJson className="text-blue-600" /> Sitemap Manager
          </h1>
          <p className="text-sm text-secondary mt-1">
            Control what Google indexes on your site.
          </p>
        </div>
        <a 
          href={`https://search.google.com/ping?sitemap=${sitemapUrl}`}
          target="_blank" rel="noreferrer"
          className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 rounded-lg font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
        >
          <ExternalLink size={14} /> Ping Google
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        
        {/* Status Card */}
        <div className="theme-bg theme-border border rounded-xl p-6">
          <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
            <CheckCircle2 size={18} className="text-emerald-500" /> Live Status
          </h3>
          <div className="flex items-center justify-between text-sm p-3 rounded-lg bg-slate-50 dark:bg-white/5 border theme-border">
            <span className="text-secondary font-bold text-xs uppercase tracking-wider">Public URL</span>
            <a href={sitemapUrl} target="_blank" rel="noreferrer" className="flex items-center gap-1 font-mono font-bold text-blue-600 hover:underline">
              /sitemap.xml <ExternalLink size={12} />
            </a>
          </div>
        </div>

        {/* Global Settings Card */}
        <div className="theme-bg theme-border border rounded-xl p-6">
           <h3 className="font-bold text-primary mb-4 flex items-center gap-2">
            <Settings size={18} className="text-blue-500" /> Global Priorities
          </h3>
           <div className="space-y-4">
             <div className="grid grid-cols-3 gap-2">
               <div>
                 <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Home</label>
                 <PrioritySelect value={globalSettings.home} onChange={v => setGlobalSettings({...globalSettings, home: v})} />
               </div>
               <div>
                 <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Posts</label>
                 <PrioritySelect value={globalSettings.posts} onChange={v => setGlobalSettings({...globalSettings, posts: v})} />
               </div>
               <div>
                 <label className="text-[10px] font-black text-secondary uppercase mb-1 block">Pages</label>
                 <PrioritySelect value={globalSettings.pages} onChange={v => setGlobalSettings({...globalSettings, pages: v})} />
               </div>
             </div>
             <button 
              onClick={handleSaveSettings}
              disabled={savingSettings}
              className="w-full py-2 bg-slate-100 dark:bg-white/10 hover:bg-blue-50 dark:hover:bg-blue-500/10 text-primary dark:text-blue-400 font-bold text-xs rounded-lg transition-colors flex items-center justify-center gap-2"
             >
               {savingSettings ? "Saving..." : <><Save size={14} /> Update Rules</>}
             </button>
           </div>
        </div>

      </div>

      {/* Custom Links Manager */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h3 className="font-bold text-primary mb-6 flex items-center gap-2 border-b theme-border pb-4">
          <LinkIcon size={18} className="text-purple-500" /> Custom Links
          <span className="text-xs font-normal text-secondary bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded ml-2">
            Manually add extra pages
          </span>
        </h3>

        {/* Add Form Container */}
        <div className="flex flex-col md:flex-row gap-4 items-end mb-8 bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border theme-border">
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">Page Path</label>
            <input 
              className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="/landing/black-friday"
              value={newPath}
              onChange={e => setNewPath(e.target.value)}
            />
          </div>
          <div className="w-full md:w-32 relative">
            <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">Priority</label>
            <PrioritySelect value={newPriority} onChange={setNewPriority} />
          </div>
          <button 
            onClick={handleAddLink}
            disabled={loading || !newPath}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {loading ? "Adding..." : <><Plus size={16} /> Add Link</>}
          </button>
        </div>

        {/* Table */}
        <div className="overflow-hidden rounded-lg border theme-border">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase">
              <tr>
                <th className="p-4">Path</th>
                <th className="p-4">Priority</th>
                <th className="p-4 text-right">Action</th>
              </tr>
            </thead>
            <tbody>
              {links.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-8 text-center text-secondary opacity-50">
                    No custom links added yet.
                  </td>
                </tr>
              ) : (
                links.map(link => (
                  <tr key={link.id} className="border-b theme-border last:border-0 hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    <td className="p-4 font-mono text-primary font-bold">{link.path}</td>
                    <td className="p-4 text-secondary">
                      <span className="bg-slate-100 dark:bg-white/10 px-2 py-1 rounded text-xs font-bold border theme-border">
                        {link.priority.toFixed(1)}
                      </span>
                    </td>
                    <td className="p-4 text-right">
                      <button onClick={() => handleDeleteLink(link.id)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors">
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}