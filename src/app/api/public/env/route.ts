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

export async function GET() {
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
      if (!key.startsWith("NEXT_PUBLIC_")) continue;
      map[key] = value;
    }
  }

  return NextResponse.json({ ok: true, env: map });
}
