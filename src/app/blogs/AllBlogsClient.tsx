"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Trash2, RotateCcw, Copy } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export default function AllBlogsClient() {
  const { user } = useAdminAuth();
  
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<"all" | "published" | "draft" | "trash">("all");

  const loadPosts = () => {
    setLoading(true);
    // Fetch all posts including trashed ones
    fetch("/api/admin/blogs?includeTrash=true")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setPosts(data.posts);
        setLoading(false);
      });
  };

  useEffect(() => { 
    loadPosts(); 
  }, []);

  // Filter Logic
  const isTrashed = (p: any) => !!p.deletedAt;
  
  const filteredPosts = posts.filter(post => {
    const trashed = isTrashed(post);
    if (view === "trash") return trashed;
    if (trashed) return false; // Hide trash from main views
    if (view === "published") return post.isPublished;
    if (view === "draft") return !post.isPublished;
    return true;
  });

  // Actions
  const handleRestore = async (id: number) => {
    if(!confirm("Restore this post from Trash?")) return;
    await fetch(`/api/admin/blogs/${id}/restore`, { method: "POST" });
    loadPosts();
  };

  const handleSoftDelete = async (id: number) => {
    if(!confirm("Move to Trash?")) return;
    await fetch(`/api/admin/blogs/${id}`, { method: "DELETE" });
    loadPosts();
  };

  const handleHardDelete = async (id: number) => {
    if(!confirm("⚠️ PERMANENTLY DELETE? This cannot be undone!")) return;
    const res = await fetch(`/api/admin/blogs/${id}?hard=true`, { method: "DELETE" });
    if (!res.ok) alert("Only Super Admins can permanently delete.");
    loadPosts();
  };

  const handleDuplicate = async (id: number) => {
    if(!confirm("Duplicate this post?")) return;
    const res = await fetch(`/api/admin/blogs/${id}/duplicate`, { method: "POST" });
    if(res.ok) loadPosts();
    else alert("Failed to duplicate.");
  };

  const Tab = ({ label, value, count }: any) => (
    <button 
      onClick={() => setView(value)}
      className={`px-4 py-2 text-sm font-bold border-b-2 transition-colors ${view === value ? "border-blue-600 text-blue-600" : "border-transparent text-secondary hover:text-primary"}`}
    >
      {label} <span className="opacity-50 text-xs ml-1">({count})</span>
    </button>
  );

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]}>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">All Posts</h1>
            <p className="text-sm text-secondary">Manage your articles and SEO content.</p>
          </div>
          <Link 
            href="/blogs/new" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Write New
          </Link>
        </div>

        {/* TABS */}
        <div className="flex items-center gap-2 border-b theme-border">
           <Tab label="All" value="all" count={posts.filter(p => !isTrashed(p)).length} />
           <Tab label="Published" value="published" count={posts.filter(p => p.isPublished && !isTrashed(p)).length} />
           <Tab label="Drafts" value="draft" count={posts.filter(p => !p.isPublished && !isTrashed(p)).length} />
           <Tab label="Trash" value="trash" count={posts.filter(p => isTrashed(p)).length} />
        </div>

        <div className="theme-bg theme-border border rounded-xl overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 dark:bg-white/5 text-xs font-black text-secondary uppercase tracking-widest border-b theme-border">
                <th className="p-4">Title</th>
                <th className="p-4">Category</th>
                <th className="p-4">Author</th>
                <th className="p-4">Status</th>
                <th className="p-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-secondary">Loading posts...</td></tr>
              ) : filteredPosts.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-secondary">No posts found in this view.</td></tr>
              ) : filteredPosts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors group">
                  <td className="p-4">
                    <div className="font-bold text-primary line-clamp-1 flex items-center gap-2">
                       {post.title}
                       {post.isFeatured && <span className="text-[10px] bg-amber-100 text-amber-700 px-1.5 rounded">★ Featured</span>}
                    </div>
                    <div className="text-xs text-secondary font-mono mt-0.5">{post.slug}</div>
                  </td>
                  <td className="p-4">
                    {post.category ? (
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                        {post.category.name}
                      </span>
                    ) : <span className="text-xs text-secondary opacity-50">-</span>}
                  </td>
                  <td className="p-4">
                    <span className="text-xs font-bold text-secondary">{post.author?.name || "Admin"}</span>
                  </td>
                  <td className="p-4">
                    {isTrashed(post) ? (
                       <span className="inline-flex items-center gap-1 text-red-500 text-xs font-bold">Trash</span>
                    ) : post.isPublished ? (
                      <span className="inline-flex items-center gap-1 text-emerald-500 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Published
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1 text-amber-500 text-xs font-bold">
                        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span> Draft
                      </span>
                    )}
                  </td>
                  <td className="p-4 text-right">
                    <div className="flex items-center justify-end gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      {view === "trash" ? (
                        <>
                          <button onClick={() => handleRestore(post.id)} className="p-2 text-emerald-600 hover:bg-emerald-50 rounded-lg" title="Restore"><RotateCcw size={16} /></button>
                          {user?.role === "ADMIN" && (
                            <button onClick={() => handleHardDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Delete Forever"><Trash2 size={16} /></button>
                          )}
                        </>
                      ) : (
                        <>
                          <Link href={`/blogs/${post.id}`} className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg" title="Edit"><Edit3 size={16} /></Link>
                          <button onClick={() => handleDuplicate(post.id)} className="p-2 text-secondary hover:bg-slate-100 rounded-lg" title="Duplicate"><Copy size={16} /></button>
                          <button onClick={() => handleSoftDelete(post.id)} className="p-2 text-red-600 hover:bg-red-50 rounded-lg" title="Trash"><Trash2 size={16} /></button>
                        </>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </RoleGuard>
  );
}