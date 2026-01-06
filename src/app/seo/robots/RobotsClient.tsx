"use client";

import React, { useEffect, useState } from "react";
import { 
  Bot, Save, ExternalLink, RotateCcw, AlertTriangle, CheckCircle2 
} from "lucide-react";

export default function RobotsClient() {
  const [content, setContent] = useState("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  const robotsUrl = `${baseUrl}/robots.txt`;

  // Default Template
  const defaultTemplate = `User-agent: *
Allow: /

# Block Admin Paths
Disallow: /api/
Disallow: /admin/
Disallow: /auth/

# Sitemap location
Sitemap: ${baseUrl}/sitemap.xml`;

  useEffect(() => {
    fetch("/api/admin/seo/robots")
      .then(r => r.json())
      .then(d => {
        if (d.ok && d.content) {
          setContent(d.content);
        } else {
          setContent(defaultTemplate); // Pre-fill with default if empty
        }
        setLoading(false);
      });
  }, []);

  const handleSave = async () => {
    setSaving(true);
    await fetch("/api/admin/seo/robots", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content })
    });
    setSaving(false);
    alert("Robots.txt updated successfully!");
  };

  const handleReset = () => {
    if (confirm("Reset to default template? Unsaved changes will be lost.")) {
      setContent(defaultTemplate);
    }
  };

  return (
    <div className="max-w-4xl space-y-8 animate-in fade-in">
      {/* Header */}
      <div className="flex justify-between items-start">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Bot className="text-blue-600" /> Robots.txt Editor
          </h1>
          <p className="text-sm text-secondary mt-1">
            Control which pages search engines can crawl.
          </p>
        </div>
        <a 
          href={robotsUrl} 
          target="_blank" 
          rel="noreferrer"
          className="px-4 py-2 bg-blue-50 text-blue-600 border border-blue-200 dark:bg-blue-500/10 dark:text-blue-400 dark:border-blue-500/30 rounded-lg font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors flex items-center gap-2"
        >
          <ExternalLink size={14} /> View Live File
        </a>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Editor Column */}
        <div className="md:col-span-2 theme-bg theme-border border rounded-xl overflow-hidden flex flex-col h-[500px]">
          <div className="p-4 border-b theme-border flex items-center justify-between bg-slate-50/50 dark:bg-white/5">
            <div className="flex items-center gap-2">
              <span className="w-3 h-3 rounded-full bg-red-500" />
              <span className="w-3 h-3 rounded-full bg-yellow-500" />
              <span className="w-3 h-3 rounded-full bg-emerald-500" />
              <span className="ml-2 text-xs font-mono font-bold text-secondary">robots.txt</span>
            </div>
            <button 
              onClick={handleReset}
              className="text-xs font-bold text-secondary hover:text-primary flex items-center gap-1"
            >
              <RotateCcw size={12} /> Reset Default
            </button>
          </div>
          
          <div className="flex-1 relative">
            {loading ? (
              <div className="absolute inset-0 flex items-center justify-center text-secondary">Loading...</div>
            ) : (
              <textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                className="w-full h-full p-6 font-mono text-sm bg-transparent text-primary outline-none resize-none leading-relaxed"
                spellCheck={false}
              />
            )}
          </div>

          <div className="p-4 border-t theme-border bg-slate-50/50 dark:bg-white/5 flex justify-end">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-500/20 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : <><Save size={16} /> Save Changes</>}
            </button>
          </div>
        </div>

        {/* Info Sidebar */}
        <div className="space-y-6">
          
          {/* Status */}
          <div className="theme-bg theme-border border rounded-xl p-6">
              <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
                <CheckCircle2 size={18} className="text-emerald-500" /> Status
              </h3>
              <div className="text-sm text-secondary">
                Your <strong>robots.txt</strong> is active and being served dynamically via the App Router.
              </div>
          </div>

          {/* Quick Tips */}
          <div className="theme-bg theme-border border rounded-xl p-6">
            <h3 className="font-bold text-primary mb-3 flex items-center gap-2">
              <AlertTriangle size={18} className="text-amber-500" /> Syntax Guide
            </h3>
            <ul className="space-y-3 text-xs text-secondary font-mono">
              <li className="bg-slate-100 dark:bg-white/5 p-2 rounded">
                <strong className="text-primary block mb-1">Allow All:</strong>
                User-agent: *<br/>Allow: /
              </li>
              <li className="bg-slate-100 dark:bg-white/5 p-2 rounded">
                <strong className="text-primary block mb-1">Block Folder:</strong>
                User-agent: *<br/>Disallow: /private/
              </li>
              <li className="bg-slate-100 dark:bg-white/5 p-2 rounded">
                <strong className="text-primary block mb-1">Sitemap:</strong>
                Sitemap: {baseUrl}/sitemap.xml
              </li>
            </ul>
          </div>

        </div>

      </div>
    </div>
  );
}