import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

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

function noStore(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET(req: Request) {
  const token = req.headers.get("x-admin-env-token") || "";
  const expected = process.env.ADMIN_ENV_TOKEN || "";

  if (!expected || token !== expected) {
    return noStore({ ok: false, error: "Unauthorized" }, 401);
  }

  const row = await prisma.systemSetting.findFirst({
    select: { envVariables: true },
  });

  const envVars = (row as any)?.envVariables;
  const map: Record<string, string> = {};

  if (Array.isArray(envVars)) {
    for (const item of envVars as EnvVar[]) {
      const key = normalizeKey((item as any)?.key);
      const value = String((item as any)?.value ?? "").trim();
      if (!key || !value) continue;
      map[key] = value;
    }
  }

  return noStore({ ok: true, env: map });
}
