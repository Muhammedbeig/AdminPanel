import { NextResponse } from "next/server";
import { getSession } from "@/lib/auth/session";
import { Role } from "@prisma/client";

// ✅ 1. Define specific types needed by require.ts
export type GuardOk = { 
  ok: true; 
  session: NonNullable<Awaited<ReturnType<typeof getSession>>> 
};

export type GuardFail = { 
  ok: false; 
  response: NextResponse 
};

// ✅ 2. Export the Union type
export type GuardResult = GuardOk | GuardFail;

// ✅ 3. Alias AuthResult for backward compatibility
export type AuthResult = GuardResult;

export async function requireRole(allowedRoles: Role[]): Promise<GuardResult> {
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