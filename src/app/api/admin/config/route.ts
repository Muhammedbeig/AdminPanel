import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const KEY = "global_settings";

export async function GET() {
  const auth = await requireRole([Role.ADMIN, Role.DEVELOPER]);
  if (!auth.ok) return auth.response;

  const config = await prisma.adminConfig.findUnique({ where: { key: KEY } });
  
  // Default values if nothing saved yet
  const defaults = {
    siteName: "LiveSocceRR Admin",
    logoUrl: "", // Empty means use default text or icon
  };

  return NextResponse.json({ ok: true, data: config?.data || defaults });
}

export async function POST(req: Request) {
  const auth = await requireRole([Role.ADMIN, Role.DEVELOPER]);
  if (!auth.ok) return auth.response;

  try {
    const body = await req.json();
    const data = body.data;

    const saved = await prisma.adminConfig.upsert({
      where: { key: KEY },
      create: { key: KEY, data },
      update: { data },
    });

    return NextResponse.json({ ok: true, data: saved.data });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to save" }, { status: 500 });
  }
}