"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Plus, Edit3, Eye, FileText } from "lucide-react";
import RoleGuard from "@/components/admin/auth/RoleGuard";

export default function AllBlogsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/admin/blogs")
      .then(res => res.json())
      .then(data => {
        if (data.ok) setPosts(data.posts);
        setLoading(false);
      });
  }, []);

  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]}>
      <div className="space-y-8">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-black text-primary">All Blog Posts</h1>
            <p className="text-sm text-secondary">Manage your articles and SEO content.</p>
          </div>
          <Link 
            href="/blogs/new" 
            className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors"
          >
            <Plus size={16} /> Write New
          </Link>
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
            <tbody className="divide-y theme-border">
              {loading ? (
                <tr><td colSpan={5} className="p-8 text-center text-secondary">Loading posts...</td></tr>
              ) : posts.length === 0 ? (
                <tr><td colSpan={5} className="p-8 text-center text-secondary">No posts found. Start writing!</td></tr>
              ) : posts.map((post) => (
                <tr key={post.id} className="hover:bg-slate-50 dark:hover:bg-white/5 transition-colors">
                  <td className="p-4">
                    <div className="font-bold text-primary line-clamp-1">{post.title}</div>
                    <div className="text-xs text-secondary font-mono mt-0.5">{post.slug}</div>
                  </td>
                  <td className="p-4">
                    {post.category ? (
                      <span className="px-2 py-1 rounded bg-blue-500/10 text-blue-600 dark:text-blue-400 text-[10px] font-black uppercase tracking-wider">
                        {post.category.name}
                      </span>
                    ) : (
                      <span className="text-xs text-secondary opacity-50">-</span>
                    )}
                  </td>
                  <td className="p-4">
                    <div className="flex items-center gap-2">
                       {post.author?.image ? (
                         // eslint-disable-next-line @next/next/no-img-element
                         <img src={post.author.image} className="w-6 h-6 rounded-full" alt="" />
                       ) : (
                         <div className="w-6 h-6 rounded-full bg-slate-200 dark:bg-slate-700 flex items-center justify-center text-[10px] font-bold">
                           {post.author?.name?.[0] || "?"}
                         </div>
                       )}
                       <span className="text-xs font-bold text-secondary">{post.author?.name || post.author?.email}</span>
                    </div>
                  </td>
                  <td className="p-4">
                    {post.isPublished ? (
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
                    <Link 
                      href={`/blogs/${post.id}`} 
                      className="inline-flex items-center justify-center w-8 h-8 rounded-lg hover:bg-slate-100 dark:hover:bg-white/10 text-secondary transition-colors"
                      title="Edit"
                    >
                      <Edit3 size={16} />
                    </Link>
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