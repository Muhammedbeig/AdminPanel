import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Security: Only Admins and Editors can restore posts
  const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
  if (!auth.ok) return auth.response;

  const { id } = await params;

  try {
    // 2. Perform Restore (Set deletedAt to null)
    await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: { deletedAt: null },
    });

    return NextResponse.json({ ok: true, message: "Post restored successfully" });
  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to restore post. It may not exist." }, 
      { status: 500 }
    );
  }
}