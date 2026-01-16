import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const categories = await prisma.blogCategory.findMany({
    select: { id: true, name: true, slug: true },
    orderBy: { name: "asc" },
  });

  return NextResponse.json({ ok: true, categories });
}
