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

    const user = await prisma.user.findUnique({ where: { email } });
    if (!user) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

    const ok = await bcrypt.compare(password, user.passwordHash);
    if (!ok) return NextResponse.json({ ok: false, error: "Invalid credentials" }, { status: 401 });

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
