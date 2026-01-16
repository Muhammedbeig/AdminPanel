import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function toInt(raw: string | null, fallback: number) {
  const n = Number(raw);
  return Number.isFinite(n) ? Math.floor(n) : fallback;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const page = Math.max(1, toInt(searchParams.get("page"), 1));
  const pageSize = Math.min(100, Math.max(1, toInt(searchParams.get("pageSize"), 10)));
  const categorySlug = (searchParams.get("category") || "").trim();
  const tagSlug = (searchParams.get("tag") || "").trim();
  const now = new Date();

  let category: { id: number; name: string; slug: string } | null = null;
  let tag: { id: number; name: string; slug: string } | null = null;

  if (categorySlug) {
    category = await prisma.blogCategory.findUnique({
      where: { slug: categorySlug },
      select: { id: true, name: true, slug: true },
    });
  }

  if (tagSlug) {
    tag = await prisma.blogTag.findUnique({
      where: { slug: tagSlug },
      select: { id: true, name: true, slug: true },
    });
  }

  if (categorySlug && !category) {
    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total: 0,
      category: null,
      tag: tag || null,
      posts: [],
    });
  }

  if (tagSlug && !tag) {
    return NextResponse.json({
      ok: true,
      page,
      pageSize,
      total: 0,
      category: category || null,
      tag: null,
      posts: [],
    });
  }

  const where: any = {
    isPublished: true,
    deletedAt: null,
    OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
  };
  if (category) where.categoryId = category.id;
  if (tag) where.tags = { some: { slug: tag.slug } };

  const skip = (page - 1) * pageSize;

  const [total, posts] = await Promise.all([
    prisma.blogPost.count({ where }),
    prisma.blogPost.findMany({
      where,
      orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
      skip,
      take: pageSize,
      select: {
        id: true,
        title: true,
        slug: true,
        excerpt: true,
        featuredImage: true,
        publishedAt: true,
        updatedAt: true,
        category: { select: { name: true, slug: true } },
        tags: { select: { name: true, slug: true } },
        author: { select: { name: true } },
      },
    }),
  ]);

  return NextResponse.json({
    ok: true,
    page,
    pageSize,
    total,
    category,
    tag,
    posts,
  });
}
