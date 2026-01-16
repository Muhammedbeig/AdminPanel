import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const row = await prisma.robotsTxt.findFirst({
    orderBy: { updatedAt: "desc" },
    select: { content: true },
  });

  return NextResponse.json({ ok: true, content: (row?.content || "").trim() });
}
