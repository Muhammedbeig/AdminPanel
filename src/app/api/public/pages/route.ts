import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { title: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json({ ok: true, pages });
}
