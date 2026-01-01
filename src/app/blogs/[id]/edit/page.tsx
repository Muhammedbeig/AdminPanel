import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma"; 
import BlogEditor from "@/components/admin/blogs/BlogEditor";

interface EditBlogPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function EditBlogPage({ params }: EditBlogPageProps) {
  // 1. ✅ Await the params to fix the crash
  const resolvedParams = await params;
  const id = parseInt(resolvedParams.id);
  
  if (isNaN(id)) {
    return notFound();
  }

  // 2. Fetch data
  const post = await prisma.blogPost.findUnique({
    where: { id },
    include: {
      category: true,
    }
  });

  if (!post) {
    return notFound();
  }

  // 3. Load Editor
  return (
    <BlogEditor post={post} />
  );
}