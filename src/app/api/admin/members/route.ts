// src/app/api/admin/members/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/require";
import { Role } from "@prisma/client";

export async function GET() {
  const guard = await requireRole([Role.ADMIN]);
  if (!guard.ok) {
    return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });
  }

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true, updatedAt: true },
  });

  return NextResponse.json({ ok: true, users });
}
