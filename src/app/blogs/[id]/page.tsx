import React from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Edit, ArrowLeft, Calendar } from "lucide-react";
import { Metadata } from "next";

interface BlogDetailsPageProps {
  params: Promise<{
    id: string;
  }>;
}

export async function generateMetadata({ params }: BlogDetailsPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) return {};

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true, content: true }
  });

  if (!post) return {};

  // Fix: Clean HTML tags safely for the description
  const cleanDescription = post.content
    .replace(/<[^>]+>/g, "") // Removes HTML tags
    .substring(0, 160);

  return {
    title: post.title,
    description: cleanDescription,
  };
}

export default async function BlogDetailsPage({ params }: BlogDetailsPageProps) {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);

  if (isNaN(id)) return notFound();

  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: { category: true } 
  });

  if (!post) return notFound();

  return (
    <div className="max-w-5xl mx-auto pb-20 space-y-8 animate-in fade-in duration-500">
      
      {/* HEADER */}
      <div className="flex items-center justify-between py-6">
        <Link 
          href="/blogs" 
          className="flex items-center gap-2 text-sm font-bold text-secondary hover:text-blue-600 transition-colors"
        >
          <ArrowLeft size={18} /> Back to Blogs
        </Link>

        <Link 
          href={`/blogs/${id}/edit`} 
          className="px-6 py-2 bg-blue-600 hover:bg-blue-500 text-white rounded-lg font-bold text-sm flex items-center gap-2 transition-colors shadow-lg shadow-blue-500/20"
        >
          <Edit size={16} /> Edit Post
        </Link>
      </div>

      {/* CONTENT PREVIEW */}
      <div className="theme-bg border theme-border rounded-2xl overflow-hidden shadow-sm">
        
        {/* Featured Image */}
        {post.featuredImage && (
          <div className="w-full h-64 md:h-80 bg-slate-100 dark:bg-white/5 relative">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img 
              src={post.featuredImage} 
              alt={post.title} 
              className="w-full h-full object-cover"
            />
          </div>
        )}

        <div className="p-8 md:p-10 space-y-6">
           {/* Meta */}
           <div className="flex flex-wrap items-center gap-4 text-xs font-bold text-secondary uppercase tracking-wider">
              {post.category && (
                <span className="text-blue-600 bg-blue-50 dark:bg-blue-500/10 px-2 py-1 rounded">
                  {post.category.name}
                </span>
              )}
             
              <div className="flex items-center gap-1">
                <Calendar size={14} />
                {new Date(post.createdAt).toLocaleDateString()}
              </div>
              <div className="flex items-center gap-1">
                <span className={`px-2 py-0.5 rounded ${post.isPublished ? "bg-green-100 dark:bg-green-500/10 text-green-700 dark:text-green-400" : "bg-yellow-100 dark:bg-yellow-500/10 text-yellow-700 dark:text-yellow-400"}`}>
                  {post.isPublished ? "Published" : "Draft"}
                </span>
              </div>
           </div>

           {/* Title */}
           <h1 className="text-3xl md:text-5xl font-black text-primary leading-tight">
             {post.title}
           </h1>

           {/* Body */}
           <div 
             className="prose dark:prose-invert max-w-none prose-lg text-secondary leading-relaxed"
             dangerouslySetInnerHTML={{ __html: post.content }}
           />
        </div>

      </div>
    </div>
  );
}