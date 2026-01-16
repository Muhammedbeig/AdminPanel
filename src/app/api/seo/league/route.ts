import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import SEO_STORE_LEAGUE_TEMPLATE from "@/livesoccerr/templates/seo-store.league";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "livesoccerr_league";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const row = await prisma.seoLeague.findUnique({ where: { key: KEY } });

  if (!row) {
    // Seed default
    const created = await prisma.seoLeague.create({
      data: { key: KEY, data: SEO_STORE_LEAGUE_TEMPLATE as any },
    });
    return NextResponse.json(
      { ok: true, data: created.data },
      { status: 200, headers: NO_STORE_HEADERS }
    );
  }

  return NextResponse.json(
    { ok: true, data: row.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}

export async function POST(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if ("response" in g) return g.response;

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

  const saved = await prisma.seoLeague.upsert({
    where: { key: KEY },
    create: { key: KEY, data },
    update: { data },
  });

  return NextResponse.json(
    { ok: true, data: saved.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
