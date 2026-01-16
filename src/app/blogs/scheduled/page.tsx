import React from "react";
import Link from "next/link";
import { Calendar, Clock, Edit3, Plus, AlertCircle } from "lucide-react";
import { prisma } from "@/lib/db/prisma";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Scheduled Posts",
  description: "View and manage scheduled blog posts"
};

export const dynamic = 'force-dynamic';

export default async function ScheduledPostsPage() {
  
  // ✅ FIX: Query now includes BOTH types of scheduled posts:
  // 1. Drafts with a date set (isPublished: false)
  // 2. Published posts with a FUTURE date (isPublished: true)
  const posts = await prisma.blogPost.findMany({
    where: {
      OR: [
        // Case 1: Drafts waiting for approval/time (regardless of date)
        { 
          isPublished: false, 
          publishedAt: { not: null } 
        },
        // Case 2: Posts marked "Published" but date is in the Future
        { 
          isPublished: true, 
          publishedAt: { gt: new Date() } 
        }
      ],
      // Exclude trashed items if your schema supports soft delete
      deletedAt: null 
    },
    include: {
      category: true
    },
    orderBy: {
      publishedAt: 'asc'
    }
  });

  // Helper to format "Goes live in..."
  const getRelativeTime = (dateStr: Date) => {
    const target = new Date(dateStr);
    const now = new Date();
    const diffInSeconds = Math.floor((target.getTime() - now.getTime()) / 1000);

    // Handle Overdue / Pending
    if (diffInSeconds < 0) {
      return "Pending / Overdue";
    }

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
        <Link 
          href="/blogs/new"
          className="px-4 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Plus size={16} /> Write New
        </Link>
      </div>

      <div className="grid grid-cols-1 gap-6">
        {posts.length === 0 ? (
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
            const date = new Date(post.publishedAt!);
            const isOverdue = new Date() > date;

            // Native Formatting
            const month = date.toLocaleString('default', { month: 'short' });
            const day = date.getDate();
            const time = date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

            return (
              <div 
                key={post.id} 
                className={`group relative flex flex-col md:flex-row items-start md:items-center gap-6 p-6 theme-bg theme-border border rounded-2xl shadow-sm hover:shadow-md transition-all ${isOverdue ? 'border-amber-500/50 bg-amber-50/10' : ''}`}
              >
                {/* Date Box */}
                <div className={`shrink-0 flex flex-col items-center justify-center w-16 h-16 rounded-xl border ${isOverdue ? 'bg-amber-100 text-amber-600 border-amber-200' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20'}`}>
                  <span className="text-xs font-bold uppercase">{month}</span>
                  <span className="text-2xl font-black">{day}</span>
                </div>

                {/* Info */}
                <div className="flex-1 min-w-0">
                   <div className="flex items-center gap-2 mb-1">
                    <span className={`inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${isOverdue ? 'bg-amber-100 text-amber-700' : 'bg-blue-100 text-blue-700'}`}>
                      {isOverdue ? <AlertCircle size={10} /> : <Clock size={10} />}
                      {isOverdue ? 'Pending / Overdue' : 'Scheduled'}
                    </span>
                   <span className="text-xs font-bold text-secondary">
                      Goes live {getRelativeTime(post.publishedAt!)}
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