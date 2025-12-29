import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import SEO_STORE_PLAYER_TEMPLATE from "@/livesoccerr/templates/seo-store.player";

export const runtime = "nodejs";

const KEY = "livesoccerr_player";

export async function GET() {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if (!g.ok) return g.response;

  const row = await prisma.seoPlayer.findUnique({ where: { key: KEY } });

  if (!row) {
    // Seed default if missing
    const created = await prisma.seoPlayer.create({
      data: { key: KEY, data: SEO_STORE_PLAYER_TEMPLATE as any },
    });
    return NextResponse.json({ ok: true, data: created.data }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: row.data }, { status: 200 });
}

export async function POST(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if (!g.ok) return g.response;

  const text = await req.text();
  if (!text) return NextResponse.json({ ok: false, error: "Missing JSON body" }, { status: 400 });

  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  const data = body?.data;
  if (!data) {
    return NextResponse.json({ ok: false, error: "Missing `data`" }, { status: 400 });
  }

  const saved = await prisma.seoPlayer.upsert({
    where: { key: KEY },
    create: { key: KEY, data },
    update: { data },
  });

  return NextResponse.json({ ok: true, data: saved.data }, { status: 200 });
}