import { NextResponse } from "next/server";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

export type GuardOk = {
  ok: true;
  user: { id: number; email: string; role: Role };
};

export type GuardFail = {
  ok: false;
  response: NextResponse;
};

export async function requireRole(allowed: Role[]): Promise<GuardOk | GuardFail> {
  const user = await getSession();

  if (!user) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 }),
    };
  }

  if (!allowed.includes(user.role)) {
    return {
      ok: false,
      response: NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 }),
    };
  }

  return { ok: true, user };
}
