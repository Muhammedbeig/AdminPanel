import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function normalizeSlug(raw: string) {
  return String(raw || "")
    .trim()
    .toLowerCase()
    .replace(/^\/+/, "")
    .replace(/\/+$/, "");
}

export async function GET(_req: Request, props: Props) {
  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);
  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });

  const faq = await prisma.fAQ.findUnique({
    where: { slug },
    include: { category: true },
  });

  if (!faq || !faq.isPublished) {
    return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });
  }

  const related =
    faq.categoryId != null
      ? await prisma.fAQ.findMany({
          where: { isPublished: true, categoryId: faq.categoryId, id: { not: faq.id } },
          orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
          take: 8,
          select: { question: true, slug: true },
        })
      : [];

  return NextResponse.json({ ok: true, faq, related });
}
