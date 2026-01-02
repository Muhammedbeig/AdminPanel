import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];

// 1. GET Single Post
export async function GET(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  
  const post = await prisma.blogPost.findUnique({
    where: { id: parseInt(id) },
    include: { category: true },
  });

  if (!post) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, post });
}

// 2. PUT (Update) Post
export async function PUT(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  const body = await req.json();

  try {
    const updated = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content,
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords,
        isPublished: body.isPublished,
        // Only update publishedAt if explicitly publishing
        ...(body.isPublished ? { publishedAt: new Date() } : {}),
        
        // ✅ New fields update
        isFeatured: body.isFeatured,
        // (We don't update deletedAt here, that's for DELETE/Restore)
      },
    });
    return NextResponse.json({ ok: true, post: updated });
  } catch (e) {
    console.error("Update Error:", e);
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

// 3. DELETE (Soft or Hard)
export async function DELETE(
  req: Request, 
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const isHardDelete = searchParams.get("hard") === "true";

  if (isHardDelete) {
    // 🛑 HARD DELETE: Only ADMIN can do this
    const auth = await requireRole([Role.ADMIN]);
    if (!auth.ok) return NextResponse.json({ error: "Only Admins can permanently delete." }, { status: 403 });

    try {
      await prisma.blogPost.delete({ where: { id: parseInt(id) } });
      return NextResponse.json({ ok: true, message: "Permanently deleted" });
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
    }
  } else {
    // ♻️ SOFT DELETE (Trash): Admins & Editors
    const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
    if (!auth.ok) return auth.response;

    try {
      await prisma.blogPost.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() } // Mark as trashed
      });
      return NextResponse.json({ ok: true, message: "Moved to trash" });
    } catch (e) {
      return NextResponse.json({ ok: false, error: "Soft delete failed" }, { status: 500 });
    }
  }
}