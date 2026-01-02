import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Auth Check
  const auth = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const session = await getSession();

  // 2. Fetch Original Post
  const original = await prisma.blogPost.findUnique({
    where: { id: parseInt(id) },
  });

  if (!original) {
    return NextResponse.json({ ok: false, error: "Original post not found" }, { status: 404 });
  }

  // 3. Create Clone
  // We append "-copy" to slug and "(Copy)" to title to avoid conflicts
  try {
    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`; // Ensure uniqueness

    const clone = await prisma.blogPost.create({
      data: {
        title: newTitle,
        slug: newSlug,
        content: original.content,
        excerpt: original.excerpt,
        featuredImage: original.featuredImage,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        keywords: original.keywords,
        categoryId: original.categoryId,
        authorId: session?.id || original.authorId, // Assign to current user
        isPublished: false, // Always draft
        isFeatured: false,
        publishedAt: null,
        deletedAt: null,
      },
    });

    return NextResponse.json({ ok: true, post: clone });
  } catch (error) {
    console.error("Duplicate Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to duplicate post" }, { status: 500 });
  }
}