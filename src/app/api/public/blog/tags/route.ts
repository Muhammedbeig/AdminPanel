import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const tags = await prisma.blogTag.findMany({
    select: { id: true, name: true, slug: true, description: true, updatedAt: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, tags });
}
