import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { permissions } from "@/lib/auth/permissions";
import { Role } from "@prisma/client"; // Or from your local enum if you prefer, but Prisma is fine here on server

// Allow all staff to attempt access; permissions.ts handles the strict logic
const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER, Role.DEVELOPER];

const slugify = (text: string) => 
  text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const post = await prisma.blogPost.findUnique({
    where: { id: parseInt(id) },
    include: { category: true, tags: true },
  });
  if (!post) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true, post });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json();
  const user = auth.session;

  try {
    const existingPost = await prisma.blogPost.findUnique({ where: { id: parseInt(id) } });
    if (!existingPost) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (!permissions.canEditPost(user, existingPost)) {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let finalIsPublished = body.isPublished;
    if (finalIsPublished === true && existingPost.isPublished === false) {
       if (!permissions.canPublishPost(user)) {
         return NextResponse.json({ error: "Forbidden: Cannot publish" }, { status: 403 });
       }
    }

    let publishedAt = undefined;
    if (body.publishedAt !== undefined) publishedAt = body.publishedAt ? new Date(body.publishedAt) : null;
    else if (finalIsPublished === true && !existingPost.publishedAt) publishedAt = new Date();

    const updated = await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        slug: body.slug ? slugify(body.slug) : undefined,
        excerpt: body.excerpt,
        content: body.content,
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        isPublished: finalIsPublished,
        ...(publishedAt !== undefined ? { publishedAt } : {}),
        isFeatured: body.isFeatured,
        tags: { set: body.tags?.map((tagId: number) => ({ id: tagId })) || [] }
      },
    });

    return NextResponse.json({ ok: true, post: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const user = auth.session;
  const { searchParams } = new URL(req.url);
  const isHardDelete = searchParams.get("hard") === "true";

  try {
    const post = await prisma.blogPost.findUnique({ where: { id: parseInt(id) }});
    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    if (isHardDelete) {
      if (!permissions.canPermanentlyDelete(user)) {
        return NextResponse.json({ error: "Forbidden: Only Admins can permanently delete" }, { status: 403 });
      }
      await prisma.blogPost.delete({ where: { id: parseInt(id) } });
      return NextResponse.json({ ok: true, message: "Permanently deleted" });
    } else {
      // ♻️ Soft Delete
      if (!permissions.canDeletePost(user, post)) {
        return NextResponse.json({ error: "Forbidden: You cannot trash this post" }, { status: 403 });
      }
      await prisma.blogPost.update({
        where: { id: parseInt(id) },
        data: { deletedAt: new Date() }
      });
      return NextResponse.json({ ok: true, message: "Moved to trash" });
    }
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}