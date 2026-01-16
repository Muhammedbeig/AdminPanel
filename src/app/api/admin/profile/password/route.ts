import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma"; // ✅ Correct Prisma Import
import { getSessionUser } from "@/lib/auth/session";
import { verifyPassword, hashPassword } from "@/lib/auth/password";

export async function PUT(req: Request) {
  const sessionUser = await getSessionUser();
  if (!sessionUser) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { currentPassword, newPassword } = await req.json();

  // 1. Get user with passwordHash
  const user = await prisma.user.findUnique({ where: { id: sessionUser.id } });
  
  // ✅ FIX: Use 'passwordHash' instead of 'password'
  if (!user || !user.passwordHash) return NextResponse.json({ error: "User not found" }, { status: 404 });

  // 2. Verify Old Password
  const isValid = await verifyPassword(currentPassword, user.passwordHash);
  if (!isValid) return NextResponse.json({ error: "Incorrect current password" }, { status: 400 });

  // 3. Hash New Password
  const hashedPassword = await hashPassword(newPassword);

  // 4. Update Database
  await prisma.user.update({
    where: { id: sessionUser.id },
    data: { passwordHash: hashedPassword }, // ✅ FIX: Use 'passwordHash'
  });

  return NextResponse.json({ ok: true });
}