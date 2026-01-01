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

  return NextResponse.json({ ok: true, user });
}

export async function PUT(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  const { name, image } = body;

  try {
    const updatedUser = await prisma.user.update({
      where: { id: sessionUser.id },
      data: { name, image },
    });
    return NextResponse.json({ ok: true, user: updatedUser });
  } catch (error) {
    return NextResponse.json({ error: "Failed to update profile" }, { status: 500 });
  }
}