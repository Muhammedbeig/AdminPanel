import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED_ROLES = [Role.ADMIN, Role.DEVELOPER];

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> } // ✅ Fix for Next.js 16
) {
  try {
    const auth = await requireRole(ALLOWED_ROLES);
    if (!auth.ok) return auth.response;

    const { id } = await params;
    const targetId = parseInt(id);

    if (isNaN(targetId)) return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });

    // Protect Main Admin (ID 1)
    if (targetId === 1) {
      return NextResponse.json({ ok: false, error: "Cannot delete Main Admin" }, { status: 403 });
    }

    // Prevent Self-Delete
    const currentUser = (auth as any).user; 
    if (currentUser?.id === targetId) {
      return NextResponse.json({ ok: false, error: "Cannot delete yourself" }, { status: 400 });
    }

    // ✅ Use 'prisma.user'
    await prisma.user.delete({ where: { id: targetId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}