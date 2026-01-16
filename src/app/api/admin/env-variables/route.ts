import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnvVar = { key: string; value: string };

function normalizeKey(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");
}

function sanitizeEnvVars(input: any): EnvVar[] {
  const arr = Array.isArray(input) ? input : [];
  const map = new Map<string, string>();

  for (const item of arr) {
    const key = normalizeKey(item?.key || "");
    const value = String(item?.value ?? "").trim();

    if (!key) continue;
    if (!/^[A-Z][A-Z0-9_]{1,120}$/.test(key)) continue;
    if (!value) continue;

    map.set(key, value);
  }

  return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
}

function noCacheJson(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET() {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  const row = await prisma.systemSetting.findFirst({
    select: { envVariables: true },
  });

  const clean = sanitizeEnvVars((row as any)?.envVariables);
  return noCacheJson({ ok: true, envVariables: clean });
}

export async function PUT(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return noCacheJson({ ok: false, error: "Invalid payload" }, 400);
  }

  const clean = sanitizeEnvVars(body.envVariables);

  const existing = await prisma.systemSetting.findFirst();
  const saved = existing
    ? await prisma.systemSetting.update({ where: { id: existing.id }, data: { envVariables: clean } })
    : await prisma.systemSetting.create({ data: { envVariables: clean } });

  return noCacheJson({ ok: true, envVariables: sanitizeEnvVars((saved as any)?.envVariables) });
}
