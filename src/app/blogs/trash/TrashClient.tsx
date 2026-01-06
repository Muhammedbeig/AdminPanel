"use client";

import React, { useEffect, useState } from "react";
import { Trash2, RotateCcw, AlertTriangle, Ban } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function TrashClient() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [userRole, setUserRole] = useState<string | null>(null);

  // 1. Safe Fetch Function
  const fetchTrash = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/blogs?status=trash");
      
      // Handle non-200 responses (like 403 Forbidden) without crashing
      if (!res.ok) {
        console.warn("Could not fetch trash:", res.status, res.statusText);
        setLoading(false);
        return;
      }

      const d = await res.json();
      if (d.ok) {
        setPosts(d.posts);
        setUserRole(d.userRole); // Capture role to control buttons
      } else {
        console.error("API Error:", d.error);
      }
    } catch (err) {
      console.error("Network/Parse Error:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchTrash(); }, []);

  // 2. Actions
  const handleRestore = async (id: number) => {
    if (!confirm("Restore this post to Drafts?")) return;
    try {
        const res = await fetch(`/api/admin/blogs/${id}/restore`, { method: "POST" });
        if (res.ok) {
            fetchTrash();
        } else {
            const d = await res.json();
            alert(d.error || "Failed to restore");
        }
    } catch (e) { alert("Error restoring post"); }
  };

  const handlePermanentDelete = async (id: number) => {
    if (!confirm("⚠️ WARNING: This will permanently delete the post.\n\nThis action cannot be undone.")) return;
    
    try {
        const res = await fetch(`/api/admin/blogs/${id}?hard=true`, { method: "DELETE" });
        if (res.ok) {
            fetchTrash();
        } else {
            const d = await res.json();
            alert(d.error || "Failed to delete");
        }
    } catch (e) { alert("Error deleting post"); }
  };

  const handleEmptyTrash = async () => {
    if (!confirm("⚠️ PERMANENTLY DELETE ALL?\n\nThis will wipe the trash completely.\nThis cannot be undone.")) return;
    
    try {
        const res = await fetch(`/api/admin/blogs/trash/empty`, { method: "DELETE" });
        if (res.ok) {
            fetchTrash();
            alert("Trash emptied successfully.");
        } else {
            const d = await res.json();
            alert(d.error || "Failed. Only Admins can empty trash.");
        }
    } catch (e) { alert("Error emptying trash"); }
  };

  // 3. UI Logic (Simple checks to hide buttons)
  // Note: The API enforces these rules strictly, this is just for better UX
  const isAdmin = userRole === "ADMIN";
  const canDeleteForever = userRole === "ADMIN" || userRole === "EDITOR";

  return (
    // Allow DEVELOPER in the list so they don't get kicked out, even if they can't edit
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "CONTENT_WRITER", "DEVELOPER"]}>
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

          {/* Empty Trash Button (Admins Only) */}
          {isAdmin && posts.length > 0 && (
             <button 
                onClick={handleEmptyTrash}
                className="px-4 py-2 bg-red-600 hover:bg-red-700 text-white text-sm font-bold rounded-lg flex items-center gap-2 transition-colors shadow-sm"
             >
                <Ban size={16} /> Empty Trash
             </button>
          )}
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
                          {/* RESTORE: Everyone can restore (Writers only see their own anyway) */}
                          <button 
                            onClick={() => handleRestore(post.id)}
                            className="px-3 py-1.5 bg-emerald-50 hover:bg-emerald-100 dark:bg-emerald-500/10 dark:hover:bg-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                          >
                              <RotateCcw size={14} /> Restore
                          </button>

                          {/* PERMANENT DELETE: Hidden for Writers */}
                          {canDeleteForever && (
                            <button 
                              onClick={() => handlePermanentDelete(post.id)}
                              className="px-3 py-1.5 bg-red-50 hover:bg-red-100 dark:bg-red-500/10 dark:hover:bg-red-500/20 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg flex items-center gap-1 transition-colors"
                            >
                              <AlertTriangle size={14} /> Delete Forever
                            </button>
                          )}
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