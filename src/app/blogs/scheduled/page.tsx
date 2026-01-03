"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { Calendar, Clock, Edit3, Plus } from "lucide-react";

export default function ScheduledPostsPage() {
  const [posts, setPosts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchScheduled = () => {
    setLoading(true);
    fetch("/api/admin/blogs?status=scheduled")
      .then(r => r.json())
      .then(d => {
        if (d.ok) setPosts(d.posts);
        setLoading(false);
      });
  };

  useEffect(() => { fetchScheduled(); }, []);

  // ✅ Helper to format "Goes live in..."
  const getRelativeTime = (dateStr: string) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);
    
    if (diffInSeconds < 60) return "in less than a minute";
    const diffInMinutes = Math.floor(diffInSeconds / 60);
    if (diffInMinutes < 60) return `in ${diffInMinutes} minute${diffInMinutes > 1 ? 's' : ''}`;
    const diffInHours = Math.floor(diffInMinutes / 60);
    if (diffInHours < 24) return `in ${diffInHours} hour${diffInHours > 1 ? 's' : ''}`;
    const diffInDays = Math.floor(diffInHours / 24);
    return `in ${diffInDays} day${diffInDays > 1 ? 's' : ''}`;
  };

  return (
    <div className="max-w-5xl mx-auto space-y-8 animate-in fade-in pb-20">
      
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <h1 className="text-3xl font-black text-primary flex items-center gap-2">
            <Calendar className="text-blue-600" /> Scheduled Posts
          </h1>
          <p className="text-sm text-secondary mt-1">
            Posts waiting to go live automatically.
          </p>
        </div>
        {/* ✅ THEME FIX: Standard Primary Button Style */}
        <Link 
          href="/blogs/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Write New
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {loading ? (
          <div className="text-center p-12 text-secondary">Loading schedule...</div>
        ) : posts.length === 0 ? (
          <div className="text-center p-12 border-2 border-dashed theme-border rounded-xl">
            <div className="w-12 h-12 bg-slate-100 dark:bg-white/5 rounded-full flex items-center justify-center mx-auto mb-3 text-secondary">
              <Calendar size={24} />
            </div>
            <h3 className="font-bold text-primary">No posts scheduled</h3>
            <p className="text-sm text-secondary mt-1">
              Set a future date in the post editor to see it here.
            </p>
          </div>
        ) : (
          posts.map((post) => {
            const date = new Date(post.publishedAt);
            
            // Native Formatting
            const month = date.toLocaleString('default', { month: 'short' });
            const day = date.getDate();
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={post.id} 
                className="group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 theme-bg theme-border border rounded-2xl shadow-sm hover:shadow-md transition-all"
              >
                {/* Date Box */}
                <div className="shrink-0 flex flex-col items-center justify-center w-16 h-16 bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 rounded-xl border border-blue-100 dark:border-blue-500/20">
                  <span className="text-xs font-bold uppercase">{month}</span>
                  <span className="text-2xl font-black">{day}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-100 dark:bg-amber-500/10 text-amber-700 dark:text-amber-400 text-[10px] font-black uppercase tracking-wider">
                      <Clock size={10} /> Scheduled
                    </span>
                    <span className="text-xs font-bold text-secondary">
                      Goes live {getRelativeTime(post.publishedAt)}
                    </span>
                  </div>
                  <h3 className="text-lg font-bold text-primary truncate group-hover:text-blue-600 transition-colors">
                    {post.title}
                  </h3>
                  <div className="flex items-center gap-3 mt-1 text-xs text-secondary font-mono">
                    {post.category && (
                      <span className="bg-slate-100 dark:bg-white/10 px-2 py-0.5 rounded">
                        {post.category.name}
                      </span>
                    )}
                    <span>{time}</span>
                  </div>
                </div>

                {/* ✅ THEME FIX: Correct Edit Button Style */}
                <Link 
                  href={`/blogs/${post.id}`} 
                  className="shrink-0 p-3 rounded-lg text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-500/10 transition-colors"
                  title="Edit Post"
                >
                  <Edit3 size={20} />
                </Link>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}