"use client";

import React, { useEffect, useState } from "react";
import { 
  ArrowRightLeft, ExternalLink, Plus, Trash2, 
  CornerDownRight, BarChart3, AlertCircle 
} from "lucide-react";

export default function RedirectsClient() {
  const [redirects, setRedirects] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  
  // Form State
  const [source, setSource] = useState("");
  const [destination, setDestination] = useState("");
  const [code, setCode] = useState("301"); // Default Permanent

  const fetchRedirects = () => {
    fetch("/api/admin/seo/redirects")
      .then(r => r.json())
      .then(d => { if(d.ok) setRedirects(d.redirects); });
  };

  useEffect(() => { fetchRedirects(); }, []);

  const handleAdd = async () => {
    if (!source) return alert("Source URL is required");
    if (!destination && code !== "410") return alert("Destination URL is required");

    setLoading(true);
    const res = await fetch("/api/admin/seo/redirects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ source, destination, type: code })
    });
    const data = await res.json();
    setLoading(false);

    if (data.ok) {
      setSource("");
      setDestination("");
      fetchRedirects();
    } else {
      alert(data.error);
    }
  };

  const handleDelete = async (id: number) => {
    if(!confirm("Stop redirecting this URL?")) return;
    await fetch("/api/admin/seo/redirects", {
      method: "DELETE", body: JSON.stringify({ id })
    });
    fetchRedirects();
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div>
        <h1 className="text-3xl font-black text-primary flex items-center gap-2">
          <ArrowRightLeft className="text-blue-600" /> Redirect Manager
        </h1>
        <p className="text-sm text-secondary mt-1">
          Manage 301/302 redirects to fix broken links and preserve SEO ranking.
        </p>
      </div>

      {/* --- ADD NEW FORM --- */}
      <div className="theme-bg theme-border border rounded-xl p-6">
        <h3 className="font-bold text-primary mb-6 flex items-center gap-2 border-b theme-border pb-4">
          <Plus size={18} className="text-emerald-500" /> New Redirect Rule
        </h3>

        <div className="flex flex-col md:flex-row gap-4 items-end mb-2 bg-slate-50/50 dark:bg-white/5 p-4 rounded-xl border theme-border">
          
          {/* Source Input */}
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">Old Path (Source)</label>
            <input 
              className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600"
              placeholder="/old-page"
              value={source}
              onChange={e => setSource(e.target.value)}
            />
          </div>

          <div className="p-2 text-secondary hidden md:block"><ArrowRightLeft size={16} /></div>

          {/* Destination Input */}
          <div className="flex-1 w-full">
            <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">New Path (Target)</label>
            <input 
              className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 text-sm placeholder:text-slate-400 dark:placeholder:text-slate-600 disabled:opacity-50"
              placeholder={code === "410" ? "Content Deleted" : "/new-page"}
              value={destination}
              onChange={e => setDestination(e.target.value)}
              disabled={code === "410"}
            />
          </div>

          {/* Type Select */}
          <div className="w-full md:w-40">
            <label className="text-xs font-black text-secondary uppercase tracking-widest block mb-1">Type</label>
            <select 
              className="w-full px-3 py-2 rounded-lg theme-bg theme-border border font-bold text-primary outline-none focus:ring-2 focus:ring-blue-500/50 text-sm cursor-pointer"
              value={code}
              onChange={e => setCode(e.target.value)}
            >
              <option value="301">301 (Perm)</option>
              <option value="302">302 (Temp)</option>
              <option value="307">307 (Temp)</option>
              <option value="308">308 (Perm)</option>
              <option value="410">410 (Deleted)</option>
            </select>
          </div>

          <button 
            onClick={handleAdd}
            disabled={loading}
            className="w-full md:w-auto px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center justify-center gap-2 transition-colors disabled:opacity-50 shadow-lg shadow-blue-500/20"
          >
            {loading ? "Saving..." : "Add Rule"}
          </button>
        </div>
      </div>

      {/* --- LIST --- */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase">
            <tr>
              <th className="p-4 w-[35%]">Source URL</th>
              <th className="p-4 w-[5%]"></th>
              <th className="p-4 w-[35%]">Target URL</th>
              <th className="p-4 w-[10%]">Type</th>
              <th className="p-4 w-[10%] text-center">Hits</th>
              <th className="p-4 w-[5%] text-right">Action</th>
            </tr>
          </thead>
          <tbody className="divide-y theme-border">
            {redirects.length === 0 ? (
              <tr>
                <td colSpan={6} className="p-8 text-center text-secondary opacity-50">
                  No redirects active.
                </td>
              </tr>
            ) : (
              redirects.map(r => (
                <tr key={r.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  
                  {/* Source */}
                  <td className="p-4 font-mono font-bold text-primary truncate max-w-[200px]" title={r.source}>
                    {r.source}
                  </td>
                  
                  {/* Icon */}
                  <td className="p-4 text-secondary">
                    <CornerDownRight size={14} />
                  </td>

                  {/* Destination */}
                  <td className="p-4">
                    {r.type === 410 ? (
                      <span className="flex items-center gap-2 text-red-500 font-bold text-xs uppercase">
                        <AlertCircle size={14} /> Content Deleted
                      </span>
                    ) : (
                      <div className="flex items-center gap-2 max-w-[200px]">
                        <span className="truncate font-mono text-xs text-blue-600 dark:text-blue-400 font-bold" title={r.destination}>
                          {r.destination}
                        </span>
                        <a href={r.destination} target="_blank" rel="noreferrer" className="opacity-0 group-hover:opacity-100 transition-opacity text-secondary hover:text-primary">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    )}
                  </td>

                  {/* Type Badge */}
                  <td className="p-4">
                    <span className={`px-2 py-1 rounded text-[10px] font-black uppercase ${
                      r.type === 301 || r.type === 308 
                        ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-500/20 dark:text-emerald-400"
                        : r.type === 410 
                        ? "bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400"
                        : "bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400"
                    }`}>
                      {r.type} {r.type === 410 ? "Gone" : (r.type === 301 || r.type === 308 ? "Perm" : "Temp")}
                    </span>
                  </td>

                  {/* Hits */}
                  <td className="p-4 text-center">
                    <div className="flex items-center justify-center gap-1.5 text-xs font-bold text-secondary">
                      <BarChart3 size={12} />
                      {r.hits}
                    </div>
                  </td>

                  {/* Delete */}
                  <td className="p-4 text-right">
                    <button 
                      onClick={() => handleDelete(r.id)}
                      className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-500/10 rounded transition-colors"
                    >
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
  );
}