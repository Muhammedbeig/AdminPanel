// src/lib/auth/require.ts
import { Role } from "@prisma/client";
import { getSession } from "./session";

// Adjust this if your session.ts exports SessionUser type
type SessionUser = {
  id: number;
  email: string;
  role: Role;
};

export type GuardOk = { ok: true; user: SessionUser };
export type GuardFail = { ok: false; status: number; error: string };
export type GuardResult = GuardOk | GuardFail;

export async function requireRole(roles: Role[]): Promise<GuardResult> {
  const session = await getSession();
  const user = (session as any)?.user as SessionUser | undefined;

  if (!user) return { ok: false, status: 401, error: "Unauthorized" };
  if (!roles.includes(user.role)) return { ok: false, status: 403, error: "Forbidden" };

  return { ok: true, user };
}
