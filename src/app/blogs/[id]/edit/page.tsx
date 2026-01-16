import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import BlogEditor from "@/components/admin/blogs/BlogEditor"; // [cite: 10]
import { Metadata } from "next";

interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Added SEO Metadata for Admin Interface
export async function generateMetadata({ params }: EditBlogPageProps): Promise<Metadata> {
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) return { title: "Invalid Blog ID" };

  const post = await prisma.blogPost.findUnique({
    where: { id },
    select: { title: true }
  });

  return {
    title: post ? `Edit: ${post.title}` : "Blog Not Found",
  };
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  // 1. ✅ Await the params
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id); // [cite: 12]
  
  if (isNaN(id)) {
    return notFound();
  }

  // 2. Fetch data
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      category: true,
    }
  }); // [cite: 13]

  if (!post) {
    return notFound();
  }

  // 3. Load Editor
  return (
    <BlogEditor post={post} /> // [cite: 14]
  );
}