import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { hashPassword } from "@/lib/auth/password";

// âœ… Use the Enum from your schema
const ALLOWED_ROLES = [Role.ADMIN, Role.DEVELOPER];

export async function GET() {
  const auth = await requireRole(ALLOWED_ROLES);
  if ("response" in auth) return auth.response;

  // âœ… Use 'prisma.user' (matching your schema)
  const members = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      role: true,
      createdAt: true,
      // We do NOT select passwordHash for security
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json({ ok: true, members });
}

export async function POST(req: Request) {
  const auth = await requireRole(ALLOWED_ROLES);
  if ("response" in auth) return auth.response;

  const body = await req.json();
  const { email, password, role } = body;

  if (!email || !password || !role) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  try {
    const passwordHash = await hashPassword(password);
    // âœ… Use 'prisma.user' and map 'password' to 'passwordHash'
    const newUser = await prisma.user.create({
      data: {
        email,
        passwordHash,
        role: role as Role,
      },
    });

    return NextResponse.json({ ok: true, user: newUser });
  } catch (error: any) {
    return NextResponse.json(
      { ok: false, error: error.message || "Failed to create user" },
      { status: 500 }
    );
  }
}


