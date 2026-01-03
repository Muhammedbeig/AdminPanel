import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];

// ✅ Slugify Helper (Strict)
const slugify = (text: string) => 
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -

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
    include: { 
      category: true,
      tags: true // ✅ Fetch tags for editor
    },
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
    // ✅ Logic: Respect provided date, or auto-set if publishing without date
    let publishedAt = undefined;
    if (body.publishedAt !== undefined) {
       publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    } else if (body.isPublished === true) {
       // If toggling publish to TRUE without sending a date, use NOW (optional logic)
    }

    const updated = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        
        // ✅ Enforce strict slug (only update if provided)
        slug: body.slug ? slugify(body.slug) : undefined,
        
        excerpt: body.excerpt,
        content: body.content,
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        
        // SEO (Keywords removed)
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        
        isPublished: body.isPublished,
        // ✅ Only update if field is sent (undefined check)
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        
        isFeatured: body.isFeatured,

        // ✅ Update Tags (Set replaces old list with new list)
        tags: {
          set: body.tags?.map((id: number) => ({ id })) || []
        }
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