import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

// Allow Writers/Editors to see categories, but only Editors/Admins to create them
const READ_ROLES = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];
const WRITE_ROLES = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER];

export async function GET() {
  const auth = await requireRole(READ_ROLES);
  if (!auth.ok) return auth.response;

  const categories = await prisma.blogCategory.findMany({
    include: { _count: { select: { posts: true } } },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const auth = await requireRole(WRITE_ROLES);
  if (!auth.ok) return auth.response;

  try {
    const { name, slug } = await req.json();
    const category = await prisma.blogCategory.create({
      data: { name, slug },
    });
    return NextResponse.json({ ok: true, category });
  } catch (e: any) {
    return NextResponse.json({ ok: false, error: "Category already exists or invalid." }, { status: 400 });
  }
}