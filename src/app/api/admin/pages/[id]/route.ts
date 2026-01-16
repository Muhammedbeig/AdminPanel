import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED = [Role.ADMIN, Role.EDITOR];

export async function GET(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;
  
  const { id } = await params;
  const page = await prisma.page.findUnique({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true, page });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const body = await req.json();
  
  try {
    const page = await prisma.page.update({
      where: { id: parseInt(id) },
      data: {
        title: body.title,
        slug: body.slug, // Ensure slug is unique/handled in UI
        content: body.content,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        isPublished: body.isPublished,
      }
    });
    return NextResponse.json({ ok: true, page });
  } catch(e) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}

export async function DELETE(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const auth = await requireRole([Role.ADMIN]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  await prisma.page.delete({ where: { id: parseInt(id) } });
  return NextResponse.json({ ok: true });
}