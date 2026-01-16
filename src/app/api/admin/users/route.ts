import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { hash } from "bcryptjs"; 

export async function POST(req: Request) {
  try {
    // 1. Auth Guard (Only Admins can create users manually)
    const auth = await requireRole([Role.ADMIN]);
    if ("response" in auth) return auth.response;

    const body = await req.json();
    const { email, password, name, role } = body;

    // 2. Validation
    if (!email || !password || !name) {
      return NextResponse.json(
        { error: "Missing required fields: email, password, name" },
        { status: 400 }
      );
    }

    // 3. Check for Existing User
    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "User with this email already exists" },
        { status: 409 }
      );
    }

    // 4. Role Validation
    // Default to CONTENT_WRITER if no role provided, or ensure role is valid
    const validRoles = Object.values(Role) as string[];
    const assignedRole = (role && validRoles.includes(role)) 
      ? (role as Role) 
      : Role.CONTENT_WRITER;

    // 5. Create User
    // Hash the password before saving!
    const hashedPassword = await hash(password, 12);

    const newUser = await prisma.user.create({
      data: {
        email,
        name,
        passwordHash: hashedPassword, // Make sure your schema uses 'passwordHash'
        role: assignedRole,
      },
    });

    // 6. Return success (exclude password hash)
    const { passwordHash: _, ...safeUser } = newUser;

    return NextResponse.json({ ok: true, user: safeUser }, { status: 201 });

  } catch (error) {
    console.error("Create User Error:", error);
    return NextResponse.json(
      { error: "Failed to create user" },
      { status: 500 }
    );
  }
}