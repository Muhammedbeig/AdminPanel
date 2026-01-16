import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

// Allow Developer access (cloning is harmless, just creates a draft)
const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER, Role.DEVELOPER];

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(ALLOWED);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const user = auth.session;

    const original = await prisma.blogPost.findUnique({ where: { id: parseInt(id) } });
    if (!original) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

    const newTitle = `${original.title} (Copy)`;
    const newSlug = `${original.slug}-copy-${Date.now()}`; 

    const clone = await prisma.blogPost.create({
      data: {
        title: newTitle,
        slug: newSlug,
        content: original.content,
        excerpt: original.excerpt,
        featuredImage: original.featuredImage,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        categoryId: original.categoryId,
        authorId: user.id, // ✅ Assign to whoever clicked the button
        isPublished: false, 
        isFeatured: false,
        publishedAt: null,
        deletedAt: null,
      },
    });

    return NextResponse.json({ ok: true, post: clone });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to duplicate" }, { status: 500 });
  }
}