import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Payload = {
  linkUrl?: string;
  sourceSlug?: string;
  sourceTitle?: string;
  statusCode?: number;
};

export async function POST(req: Request) {
  const body = (await req.json().catch(() => null)) as Payload | null;
  if (!body) return NextResponse.json({ ok: false, error: "Invalid payload" }, { status: 400 });

  const linkUrl = String(body.linkUrl || "").trim();
  const sourceSlug = String(body.sourceSlug || "").trim();
  const sourceTitle = String(body.sourceTitle || "").trim();
  const statusCode = Number(body.statusCode || 0);

  if (!linkUrl || !sourceSlug || !sourceTitle || !Number.isFinite(statusCode)) {
    return NextResponse.json({ ok: false, error: "Missing fields" }, { status: 400 });
  }

  await prisma.brokenLink.create({
    data: { linkUrl, sourceSlug, sourceTitle, statusCode },
  });

  return NextResponse.json({ ok: true });
}
