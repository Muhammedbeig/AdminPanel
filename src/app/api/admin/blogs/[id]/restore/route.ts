import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // Allow Admins and Editors to restore
  const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  await prisma.blogPost.update({
    where: { id: parseInt(id) },
    data: { deletedAt: null },
  });

  return NextResponse.json({ ok: true });
}