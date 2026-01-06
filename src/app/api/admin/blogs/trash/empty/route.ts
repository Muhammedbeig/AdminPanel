import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export async function DELETE(req: Request) {
  try {
    // 🛑 Strictly Admins only
    const auth = await requireRole([Role.ADMIN]);
    if (!auth.ok) return auth.response;

    const result = await prisma.blogPost.deleteMany({
      where: { deletedAt: { not: null } }
    });

    return NextResponse.json({ 
      ok: true, 
      message: `Trash emptied. ${result.count} posts deleted.` 
    });
  } catch (error) {
    return NextResponse.json({ error: "Failed to empty trash" }, { status: 500 });
  }
}