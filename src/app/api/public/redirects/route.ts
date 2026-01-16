import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const redirects = await prisma.redirect.findMany({
    where: { isActive: true },
    select: { source: true, destination: true, type: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, redirects });
}
