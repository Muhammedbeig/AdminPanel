import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

export const runtime = "nodejs";

export async function GET() {
  const g = await requireRole([Role.ADMIN]);
  if (!g.ok) return g.response;

  const users = await prisma.user.findMany({
    orderBy: { createdAt: "desc" },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, users }, { status: 200 });
}

export async function POST(req: Request) {
  const g = await requireRole([Role.ADMIN]);
  if (!g.ok) return g.response;

  const text = await req.text();
  if (!text) return NextResponse.json({ ok: false, error: "Missing JSON body" }, { status: 400 });

  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const email = String(body?.email || "").trim().toLowerCase();
  const password = String(body?.password || "");
  const role = (body?.role || Role.ADMIN) as Role;

  if (!email || !password) {
    return NextResponse.json({ ok: false, error: "Missing email/password" }, { status: 400 });
  }

  const exists = await prisma.user.findUnique({ where: { email } });
  if (exists) return NextResponse.json({ ok: false, error: "User already exists" }, { status: 409 });

  const passwordHash = await hashPassword(password);

  const created = await prisma.user.create({
    data: { email, passwordHash, role },
    select: { id: true, email: true, role: true, createdAt: true },
  });

  return NextResponse.json({ ok: true, user: created }, { status: 201 });
}
