import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import SEO_STORE_MATCH_TEMPLATE from "@/livesoccerr/templates/seo-store.match";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "livesoccerr_match";
const NO_STORE_HEADERS = { "Cache-Control": "no-store, max-age=0" };

export async function GET() {
  const row = await prisma.seoMatch.findUnique({ where: { key: KEY } });

  if (!row) {
    // Seed default if not exists
    const created = await prisma.seoMatch.create({
      data: { key: KEY, data: SEO_STORE_MATCH_TEMPLATE as any },
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

  // Update or create
  const saved = await prisma.seoMatch.upsert({
    where: { key: KEY },
    create: { key: KEY, data },
    update: { data },
  });

  return NextResponse.json(
    { ok: true, data: saved.data },
    { status: 200, headers: NO_STORE_HEADERS }
  );
}
