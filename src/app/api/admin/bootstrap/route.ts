import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { hashPassword } from "@/lib/auth/password";
import { Role } from "@prisma/client";

export async function POST(req: Request) {
  const headerSecret = req.headers.get("x-admin-bootstrap-secret");
  const body = await req.json().catch(() => ({} as any));
  const secret = headerSecret || body?.secret;

  if (!secret || secret !== process.env.ADMIN_BOOTSTRAP_SECRET) {
    return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });
  }

  const email = process.env.ADMIN_DEFAULT_EMAIL;
  const password = process.env.ADMIN_DEFAULT_PASSWORD;

  if (!email || !password) {
    return NextResponse.json(
      { ok: false, error: "Missing ADMIN_DEFAULT_EMAIL or ADMIN_DEFAULT_PASSWORD in env" },
      { status: 500 }
    );
  }

  const normalizedEmail = email.trim().toLowerCase();
  const existing = await prisma.user.findUnique({ where: { email: normalizedEmail } });

  if (!existing) {
    const passwordHash = await hashPassword(password);
    const created = await prisma.user.create({
      data: { email: normalizedEmail, passwordHash, role: Role.ADMIN },
      select: { id: true, email: true, role: true },
    });
    return NextResponse.json({
      ok: true,
      id: created.id,
      email: created.email,
      role: created.role,
      note: "Admin user created. Login using ADMIN_DEFAULT_PASSWORD.",
    });
  }

  // also enforce role=ADMIN for the main account
  if (existing.role !== Role.ADMIN) {
    await prisma.user.update({ where: { id: existing.id }, data: { role: Role.ADMIN } });
  }

  return NextResponse.json({
    ok: true,
    id: existing.id,
    email: existing.email,
    role: Role.ADMIN,
    note: "Admin user ensured. Login using ADMIN_DEFAULT_PASSWORD.",
  });
}
