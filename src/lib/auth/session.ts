import { cookies } from "next/headers";
import crypto from "crypto";
import { Role } from "@prisma/client";

export type SessionUser = { id: number; email: string; role: Role };

const COOKIE = "admin_session";
const SECRET = process.env.ADMIN_SESSION_SECRET || "dev-secret-change-me";

function sign(input: string) {
  return crypto.createHmac("sha256", SECRET).update(input).digest("base64url");
}

export async function setSession(user: SessionUser) {
  const payload = JSON.stringify({ ...user, iat: Date.now() });
  const body = Buffer.from(payload).toString("base64url");
  const sig = sign(body);
  const value = `${body}.${sig}`;

  const jar = await cookies();
  jar.set(COOKIE, value, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE)?.value;
  if (!raw) return null;

  const [body, sig] = raw.split(".");
  if (!body || !sig) return null;

  const expected = sign(body);
  if (!crypto.timingSafeEqual(Buffer.from(sig), Buffer.from(expected))) return null;

  try {
    const parsed = JSON.parse(Buffer.from(body, "base64url").toString("utf8"));
    return {
      id: Number(parsed.id),
      email: String(parsed.email),
      role: parsed.role as Role,
    };
  } catch {
    return null;
  }
}

export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE, "", { path: "/", maxAge: 0 });
}
