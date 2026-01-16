import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const READ_ROLES = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];
const WRITE_ROLES = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER];

export async function GET() {
  const auth = await requireRole(READ_ROLES);
  if ("response" in auth) return auth.response;

  const categories = await prisma.blogCategory.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const auth = await requireRole(WRITE_ROLES);
  if ("response" in auth) return auth.response;

  try {
    const { name, slug } = await req.json();
    const category = await prisma.blogCategory.create({
      data: { name, slug },
    });
    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Category exists" }, { status: 400 });
  }
}

export async function PUT(req: Request) {
  const auth = await requireRole(WRITE_ROLES);
  if ("response" in auth) return auth.response;
  try {
    const { id, name, slug } = await req.json();
    await prisma.blogCategory.update({
      where: { id: parseInt(id) },
      data: { name, slug },
    });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

// ✅ UPDATED: Support Bulk Delete
export async function DELETE(req: Request) {
  const auth = await requireRole(WRITE_ROLES);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    // Handle both single 'id' or multiple 'ids'
    const ids = body.ids ? body.ids : (body.id ? [body.id] : []);

    if (ids.length === 0) return NextResponse.json({ ok: false, error: "No IDs provided" }, { status: 400 });

    // 1. Unlink posts first (Set categoryId to null for these posts)
    await prisma.blogPost.updateMany({
        where: { categoryId: { in: ids } },
        data: { categoryId: null }
    });

    // 2. Delete Categories
    await prisma.blogCategory.deleteMany({
      where: { id: { in: ids } },
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}