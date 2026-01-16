import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED_ROLES = [Role.ADMIN, Role.DEVELOPER];

export async function DELETE(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole(ALLOWED_ROLES);
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const targetId = parseInt(id);

    if (isNaN(targetId)) return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });

    if (targetId === 1) {
      return NextResponse.json({ ok: false, error: "Cannot delete Main Admin" }, { status: 403 });
    }

    const currentUser = auth.session; 
    if (currentUser?.id === targetId) {
      return NextResponse.json({ ok: false, error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({ where: { id: targetId } });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}

// ✅ NEW: PATCH Method (Change Role)
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const auth = await requireRole([Role.ADMIN]); // Strictly Admins only
    if ("response" in auth) return auth.response;

    const { id } = await params;
    const targetId = parseInt(id);
    const body = await req.json();

    if (isNaN(targetId)) return NextResponse.json({ ok: false, error: "Invalid ID" }, { status: 400 });

    if (targetId === 1) {
      return NextResponse.json({ ok: false, error: "Cannot modify Main Admin" }, { status: 403 });
    }

    // Validate Role
    const validRoles = Object.values(Role);
    if (!body.role || !validRoles.includes(body.role)) {
      return NextResponse.json({ ok: false, error: "Invalid role provided" }, { status: 400 });
    }

    const updatedUser = await prisma.user.update({
      where: { id: targetId },
      data: { role: body.role },
    });

    const { passwordHash, ...safeUser } = updatedUser;
    return NextResponse.json({ ok: true, user: safeUser });

  } catch (error) {
    console.error("Role Update Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to update role" }, { status: 500 });
  }
}