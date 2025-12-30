import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
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

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
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
        // Only update publishedAt if explicitly publishing for first time
        ...(body.isPublished ? { publishedAt: new Date() } : {}),
      },
    });

    return NextResponse.json({ ok: true, post: updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  // Only Admins/Editors can delete (Writers cannot delete)
  const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
  if (!auth.ok) return auth.response;

  const { id } = await params;
  await prisma.blogPost.delete({ where: { id: parseInt(id) } });

  return NextResponse.json({ ok: true });
}