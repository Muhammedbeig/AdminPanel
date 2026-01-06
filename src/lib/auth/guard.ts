import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

export type AuthResult = 
  | { ok: true; session: NonNullable<Awaited<ReturnType<typeof getSession>>> } 
  | { ok: false; response: NextResponse };

export async function requireRole(allowedRoles: Role[]): Promise<AuthResult> {
  const session = await getSession();

  // 1. Check Login
  if (!session) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Unauthorized" }, { status: 401 }),
    };
  }

  // 2. Super Admin Bypass (Checks Email)
  const isSuperAdmin = process.env.SUPER_ADMIN_EMAIL && session.email === process.env.SUPER_ADMIN_EMAIL;

  // 3. Role Check (Skipped if Super Admin)
  if (!isSuperAdmin && !allowedRoles.includes(session.role)) {
    return {
      ok: false,
      response: NextResponse.json({ error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, session };
}