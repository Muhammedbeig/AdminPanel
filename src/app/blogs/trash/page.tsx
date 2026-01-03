"use client";

import React, { useEffect, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function TrashPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  // Load Trash
  const fetchTrash = () => {
    setLoading(true);
    // [cite: 55]
    fetch("/api/admin/blogs?status=trash")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setPosts(d.posts);
        setLoading(false);
      });
  };

  useEffect(() => { fetchTrash(); }, []);

  // Actions
  const handleRestore = async (id: number) => {
    if (!confirm("Restore this post to Drafts?")) return;
    const res = await fetch(`/api/admin/blogs/${id}/restore`, { method: "POST" });
    if (res.ok) fetchTrash();
  };

  const handlePermanentDelete = async (id: number) => {
    // [cite: 58]
    if (!confirm("⚠️ WARNING: This will permanently delete the post and its SEO data.\n\nThis action cannot be undone.")) return;
    const res = await fetch(`/api/admin/blogs/${id}?hard=true`, { method: "DELETE" });
    if (res.ok) fetchTrash();
    else alert("Failed to delete. You might not have permission.");
  };

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR"]}>
      <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-20">
        
        {/* Header */}
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-3xl font-black text-primary flex items-center gap-2">
              <Trash2 className="text-red-600" /> Trash
            </h1>
            <p className="text-sm text-secondary mt-1">
              Posts removed from the site. Restore them or delete forever.
            </p>
          </div>
        </div>

        {/* List */}
        <div className="theme-bg theme-border border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead className="bg-slate-50 dark:bg-white/5 border-b theme-border text-xs font-black text-secondary uppercase tracking-widest">
              <tr>
                <th className="p-4 w-1/2">Post Details</th>
                <th className="p-4">Deleted Date</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={3} className="p-8 text-center text-secondary">Loading trash...</td></tr>
              ) : posts.length === 0 ? (
                <tr>
                  <td colSpan={3} className="p-12 text-center">
                    <div className="w-12 h-12 bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 rounded-full flex items-center justify-center mx-auto mb-3">
                      <RotateCcw size={24} />
                    </div>
                    <h3 className="font-bold text-primary">Trash is empty</h3>
                    <p className="text-sm text-secondary mt-1">Good job keeping things clean!</p>
                  </td>
                </tr>
              ) : (
                posts.map((post) => (
                  <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group border-b theme-border last:border-0">
                    <td className="p-4">
                      <div className="font-bold text-primary line-clamp-1">{post.title}</div>
                      <div className="text-xs text-secondary font-mono mt-0.5 line-clamp-1">/{post.slug}</div>
                    </td>
                    <td className="p-4 text-xs font-bold text-red-500">
                      {new Date(post.deletedAt).toLocaleDateString()}
                    </td>
                    <td className="p-4 text-right">
                       <div className="flex items-center justify-end gap-2">
                         <button 
                           onClick={() => handleRestore(post.id)}
                           className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                         >
                            <RotateCcw size={14} /> Restore
                         </button>
                         <button 
                           onClick={() => handlePermanentDelete(post.id)}
                           className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                         >
                           <AlertTriangle size={14} /> Delete Forever
                        </button>
                       </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        
      </div>
    </RoleGuard>
  );
}