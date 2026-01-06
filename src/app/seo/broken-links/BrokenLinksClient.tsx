"use client";

import React, { useEffect, useState } from "react";
import { 
  Link2Off, RefreshCw, AlertTriangle, ExternalLink, CheckCircle2, FileText 
} from "lucide-react";
import Link from "next/link";

export default function BrokenLinksClient() {
  const [links, setLinks] = useState<any[]>([]);
  const [scanning, setScanning] = useState(false);
  const [loading, setLoading] = useState(true);

  const fetchReport = () => {
    setLoading(true);
    fetch("/api/admin/seo/broken-links")
      .then(r => r.json())
      .then(d => { 
        if(d.ok) setLinks(d.links); 
        setLoading(false); 
      });
  };

  useEffect(() => { fetchReport(); }, []);

  const handleScan = async () => {
    setScanning(true);
    const res = await fetch("/api/admin/seo/broken-links", { method: "POST" });
    const data = await res.json();
    setScanning(false);
    if(data.ok) {
      alert(`Scan complete. Found ${data.count} broken links.`);
      fetchReport();
    } else {
      alert("Scan failed. Check console.");
    }
  };

  return (
    <div className="max-w-5xl space-y-8 animate-in fade-in">
      
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Link2Off className="text-red-500" /> Broken Link Checker
          </h1>
          <p className="text-sm text-secondary mt-1">
            Scan your content for 404s and dead external links.
          </p>
        </div>
        <button 
          onClick={handleScan}
          disabled={scanning}
          className="px-6 py-2.5 bg-blue-600 hover:bg-blue-500 text-white rounded-xl font-bold text-sm flex items-center gap-2 transition-all shadow-lg shadow-blue-500/20 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw size={16} className={scanning ? "animate-spin" : ""} />
          {scanning ? "Scanning Entire Site..." : "Run New Scan"}
        </button>
      </div>

      {/* Info Card */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="theme-bg theme-border border rounded-xl p-6 flex flex-col justify-between">
           <div className="flex items-center gap-3 mb-2">
             <div className="p-2 rounded-lg bg-red-500/10 text-red-500"><AlertTriangle size={20} /></div>
             <span className="text-xs font-black text-secondary uppercase tracking-widest">Broken Links Found</span>
           </div>
           <div className="text-3xl font-black text-primary">
             {links.length}
           </div>
        </div>

        <div className="md:col-span-2 theme-bg theme-border border rounded-xl p-6">
          <h3 className="font-bold text-primary mb-2">Why fix these?</h3>
          <p className="text-sm text-secondary leading-relaxed">
            Broken links negatively impact your SEO score and frustrate users. 
            Search engines (Google) lower the ranking of pages with dead links. 
            It is recommended to run this scan <strong>weekly</strong>.
          </p>
        </div>
      </div>

      {/* Results List */}
      <div className="theme-bg theme-border border rounded-xl overflow-hidden">
        <div className="p-4 border-b theme-border flex items-center justify-between">
          <h3 className="font-bold text-primary">Scan Results</h3>
          <span className="text-xs font-bold text-secondary bg-slate-100 dark:bg-white/5 px-2 py-1 rounded">
              Last checked: Just now
          </span>
        </div>

        {loading ? (
           <div className="p-12 text-center text-secondary">Loading report...</div>
        ) : links.length === 0 ? (
           <div className="p-12 text-center flex flex-col items-center gap-3">
             <div className="p-4 rounded-full bg-emerald-500/10 text-emerald-500">
               <CheckCircle2 size={32} />
             </div>
             <div>
               <h4 className="font-bold text-primary">All Clear!</h4>
               <p className="text-sm text-secondary">No broken links were found in your published posts.</p>
             </div>
           </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase">
                <tr>
                  <th className="p-4 w-[40%]">Broken URL</th>
                  <th className="p-4 w-[15%]">Status</th>
                  <th className="p-4 w-[30%]">Found In Post</th>
                  <th className="p-4 w-[15%] text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y theme-border">
                {links.map((link) => (
                  <tr key={link.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                    
                    {/* The Broken Link */}
                    <td className="p-4">
                      <div className="flex items-center gap-2 max-w-[300px]">
                        <span className="truncate font-mono text-xs text-red-500 font-bold" title={link.linkUrl}>
                          {link.linkUrl}
                        </span>
                        <a href={link.linkUrl} target="_blank" rel="noreferrer" className="text-secondary hover:text-primary">
                          <ExternalLink size={12} />
                        </a>
                      </div>
                    </td>

                    {/* Status Code */}
                    <td className="p-4">
                      {link.statusCode === 404 ? (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-red-100 text-red-700 dark:bg-red-500/20 dark:text-red-400">
                          404 Not Found
                        </span>
                      ) : link.statusCode === 0 ? (
                         <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-amber-100 text-amber-700 dark:bg-amber-500/20 dark:text-amber-400">
                          Timeout / Error
                        </span>
                      ) : (
                        <span className="inline-flex items-center px-2 py-1 rounded-md text-xs font-bold bg-slate-100 text-slate-700 dark:bg-white/10 dark:text-slate-300">
                          Error {link.statusCode}
                        </span>
                      )}
                    </td>

                    {/* Source Post */}
                    <td className="p-4">
                      <div className="flex flex-col">
                        <span className="font-bold text-primary truncate max-w-[200px]">{link.sourceTitle}</span>
                        <span className="text-xs text-secondary font-mono truncate">/{link.sourceSlug}</span>
                      </div>
                    </td>

                    {/* Action Button */}
                    <td className="p-4 text-right">
                      {/* Assuming you have an edit page like /blogs/edit/[slug] */}
                      <Link 
                        href={`/blogs/edit/${link.sourceSlug}`}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400 font-bold text-xs hover:bg-blue-100 dark:hover:bg-blue-500/20 transition-colors"
                      >
                        <FileText size={12} /> Edit Post
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}