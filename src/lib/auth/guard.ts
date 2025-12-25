import { NextResponse } from "next/server";
import type { Role } from "@prisma/client";
import { getSessionUser } from "@/lib/auth/session";

export type GuardOk = {
  ok: true;
  status: 200;
  user: NonNullable<Awaited<ReturnType<typeof getSessionUser>>>;
};

export type GuardFail = {
  ok: false;
  status: number;

  // Keep these 3 to satisfy all your old call-sites
  error: string;
  message: string;
  reason: string;

  // For call-sites that do: `return g.response`
  response: NextResponse;
};

export type GuardResult = GuardOk | GuardFail;

function fail(status: number, msg: string): GuardFail {
  const response = NextResponse.json({ ok: false, error: msg }, { status });
  return {
    ok: false,
    status,
    error: msg,
    message: msg,
    reason: msg,
    response,
  };
}

/**
 * ✅ This is the export your routes are importing:
 * import { requireRole } from "@/lib/auth/guard";
 */
export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const user = await getSessionUser();
  if (!user) return fail(401, "Unauthorized");
  if (!roles.includes(user.role)) return fail(403, "Forbidden");
  return { ok: true, status: 200, user };
}
