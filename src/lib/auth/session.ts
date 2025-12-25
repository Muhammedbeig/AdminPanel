import crypto from "node:crypto";
import { cookies } from "next/headers";
import { Role } from "@prisma/client";

export type SessionUser = {
  id: number;
  email: string;
  role: Role;
};

const COOKIE_NAME = "admin_session";

// Prefer a dedicated secret. Fallbacks are for dev only.
const SESSION_SECRET =
  process.env.ADMIN_SESSION_SECRET ||
  process.env.ADMIN_BOOTSTRAP_SECRET ||
  process.env.NEXTAUTH_SECRET ||
  "dev-secret-change-me";

const DEFAULT_MAX_AGE_DAYS = 30;

function b64urlEncode(input: Buffer | string) {
  const buf = typeof input === "string" ? Buffer.from(input, "utf8") : input;
  return buf
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function b64urlDecodeToBuffer(input: string) {
  const pad = input.length % 4 ? 4 - (input.length % 4) : 0;
  const base64 = input.replaceAll("-", "+").replaceAll("_", "/") + "=".repeat(pad);
  return Buffer.from(base64, "base64");
}

function sign(payloadB64: string) {
  return b64urlEncode(crypto.createHmac("sha256", SESSION_SECRET).update(payloadB64).digest());
}

function safeEqual(a: string, b: string) {
  const aa = Buffer.from(a, "utf8");
  const bb = Buffer.from(b, "utf8");
  if (aa.length !== bb.length) return false;
  return crypto.timingSafeEqual(aa, bb);
}

function isProd() {
  return process.env.NODE_ENV === "production";
}

/**
 * Reads the current session user from cookie (or null).
 */
export async function getSession(): Promise<SessionUser | null> {
  const jar = await cookies();
  const raw = jar.get(COOKIE_NAME)?.value;
  if (!raw) return null;

  const [payloadB64, sig] = raw.split(".");
  if (!payloadB64 || !sig) return null;

  const expected = sign(payloadB64);
  if (!safeEqual(sig, expected)) return null;

  try {
    const payloadJson = b64urlDecodeToBuffer(payloadB64).toString("utf8");
    const payload = JSON.parse(payloadJson) as { u: SessionUser; exp: number };

    if (!payload?.u || typeof payload.exp !== "number") return null;
    if (Date.now() > payload.exp) return null;

    return payload.u;
  } catch {
    return null;
  }
}

/**
 * Sets session cookie for the given user.
 */
export async function setSession(user: SessionUser, maxAgeDays = DEFAULT_MAX_AGE_DAYS) {
  const jar = await cookies();
  const exp = Date.now() + maxAgeDays * 24 * 60 * 60 * 1000;

  const payload = b64urlEncode(JSON.stringify({ u: user, exp }));
  const token = `${payload}.${sign(payload)}`;

  jar.set(COOKIE_NAME, token, {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: maxAgeDays * 24 * 60 * 60,
  });
}

/**
 * Clears the session cookie.
 */
export async function clearSession() {
  const jar = await cookies();
  jar.set(COOKIE_NAME, "", {
    httpOnly: true,
    sameSite: "lax",
    secure: isProd(),
    path: "/",
    maxAge: 0,
  });
}

/* ---- Backwards-compatible exports (so other files won’t break) ---- */
export const getSessionUser = getSession;
export const setSessionCookie = setSession;
export const clearSessionCookie = clearSession;
