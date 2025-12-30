import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/db/prisma";
import { setSession } from "@/lib/auth/session";

type Body = { email?: string; password?: string };

export async function POST(req: NextRequest) {
  try {
    const raw = await req.text();

    if (!raw.trim()) {
      return NextResponse.json(
        { ok: false, error: "Missing JSON body (send: { email, password })" },
        { status: 400 }
      );
    }

    let body: Body;
    try {
      body = JSON.parse(raw);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON body" }, { status: 400 });
    }

    const email = (body.email ?? "").trim().toLowerCase();
    const password = body.password ?? "";

    if (!email || !password) {
      return NextResponse.json(
        { ok: false, error: "Email and password are required" },
        { status: 400 }
      );
    }

    // ✅ Match 'User' model from schema.prisma
    const user = await prisma.user.findUnique({ where: { email } });
    
    if (!user) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    // 1. Try bcrypt comparison (Standard Security)
    let isValid = await bcrypt.compare(password, user.passwordHash);

    // 2. Fallback: Check plain text (For dev/users created via Admin Panel without hashing)
    if (!isValid && user.passwordHash === password) {
      isValid = true;
    }

    if (!isValid) {
      return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });
    }

    // ✅ Set Session with Role
    await setSession({ id: user.id, email: user.email, role: user.role });

    return NextResponse.json({
      ok: true,
      user: { id: user.id, email: user.email, role: user.role },
    });

  } catch (e) {
    console.error("[POST /api/auth/login]", e);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}