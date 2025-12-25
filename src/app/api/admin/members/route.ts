import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { Role } from "@prisma/client";
import { requireRole } from "@/lib/auth/require";
import { hashPassword } from "@/lib/auth/password";
import { parseRole } from "@/lib/auth/roles";

export async function GET() {
  const guard = await requireRole([Role.ADMIN]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, users });
}

export async function POST(req: Request) {
  const guard = await requireRole([Role.ADMIN]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

  const body = await req.json().catch(() => null);
  const email = String(body?.email ?? "").trim().toLowerCase();
  const password = String(body?.password ?? "");
  const role = parseRole(body?.role) ?? Role.EDITOR;

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing email or password" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ ok: false, error: "Email already exists" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const user = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, user });
}
