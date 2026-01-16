import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const categorySlug = (searchParams.get("category") || "").trim();
  const q = (searchParams.get("q") || "").trim();

  let category: { id: number; name: string; slug: string } | null = null;
  if (categorySlug) {
    category = await prisma.fAQCategory.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true, slug: true },
    });
  }

  if (categorySlug && !category) {
    return NextResponse.json({ ok: true, category: null, faqs: [] });
  }

  const where: any = { isPublished: true };
  if (category) where.categoryId = category.id;
  if (q) {
    where.OR = [{ question: { contains: q } }, { answer: { contains: q } }];
  }

  const faqs = await prisma.fAQ.findMany({
    where,
    include: { category: true },
    orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
  });

  return NextResponse.json({ ok: true, category, faqs });
}
