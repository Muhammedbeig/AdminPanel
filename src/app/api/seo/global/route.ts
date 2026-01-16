import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";
import SEO_STORE_GLOBAL_TEMPLATE from "@/livesoccerr/templates/seo-store.global";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const KEY = "livesoccerr";

export async function GET() {
  const row = await prisma.seoGlobal.findUnique({ where: { key: KEY } });

  if (!row) {
    const created = await prisma.seoGlobal.create({
      data: { key: KEY, data: SEO_STORE_GLOBAL_TEMPLATE as any },
    });
    return NextResponse.json({ ok: true, data: created.data }, { status: 200 });
  }

  return NextResponse.json({ ok: true, data: row.data }, { status: 200 });
}

async function handleSave(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if ("response" in g) return g.response;

  const text = await req.text();
  if (!text) {
    return NextResponse.json({ ok: false, error: "Missing JSON body" }, { status: 400 });
  }

  let body: any;
  try {
    body = JSON.parse(text);
  } catch {
    return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
  }

  try {
    const updated = await prisma.seoGlobal.upsert({
      where: { key: KEY },
      create: { key: KEY, data: body },
      update: { data: body },
    });

    // Make sure any server-rendered metadata/layout picks up the new data ASAP
    revalidatePath("/", "layout");

    return NextResponse.json({ ok: true, data: updated.data }, { status: 200 });
  } catch (error) {
    console.error("SEO Global Update Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to save settings" }, { status: 500 });
  }
}

// ✅ Admin UI uses POST (your GlobalSeoClient does method: "POST")
export async function POST(req: Request) {
  return handleSave(req);
}

// ✅ Keep PUT too (backward-compatible / manual calls)
export async function PUT(req: Request) {
  return handleSave(req);
}
