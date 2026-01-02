import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma"; // ✅ Correct Prisma Import
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const user = await prisma.user.findUnique({
    where: { id: sessionUser.id },
    select: { name: true, email: true, image: true, role: true }
  });

  // ✅ Safety Check: If DB was reset, user might be null
  if (!user) {
    return NextResponse.json({ error: "User not found" }, { status: 404 });
  }

  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, image } = body;

  try {
    // ✅ CRITICAL FIX: Check if user exists first to prevent P2025 crash
    const existingUser = await prisma.user.findUnique({ 
      where: { id: sessionUser.id } 
    });
    
    if (!existingUser) {
      return NextResponse.json(
        { error: "User record missing. Please logout and login again." }, 
        { status: 404 }
      );
    }

    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name, image },
    });

    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error) {
    console.error("Profile Update Error:", error);
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}