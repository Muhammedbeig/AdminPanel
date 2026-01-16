import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const now = new Date();

  const [settings, blogCategories, blogTags, blogPosts, faqCategories, faqs, pages, links] =
    await Promise.all([
      prisma.sitemapSettings.findFirst(),
      prisma.blogCategory.findMany({
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.blogTag.findMany({
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.blogPost.findMany({
        where: {
          isPublished: true,
          deletedAt: null,
          OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
        },
        select: {
          slug: true,
          updatedAt: true,
          publishedAt: true,
          category: { select: { slug: true } },
        },
        orderBy: [{ publishedAt: "desc" }, { updatedAt: "desc" }],
        take: 10000,
      }),
      prisma.fAQCategory.findMany({
        select: { slug: true, name: true },
        orderBy: { name: "asc" },
      }),
      prisma.fAQ.findMany({
        where: { isPublished: true },
        select: {
          slug: true,
          updatedAt: true,
          category: { select: { slug: true } },
        },
        orderBy: [{ order: "asc" }, { updatedAt: "desc" }],
        take: 20000,
      }),
      prisma.page.findMany({
        where: { isPublished: true },
        select: { slug: true, updatedAt: true },
        orderBy: { updatedAt: "desc" },
        take: 50000,
      }),
      prisma.sitemapLink.findMany({ orderBy: { updatedAt: "desc" } }),
    ]);

  return NextResponse.json({
    ok: true,
    settings: settings || {
      homePriority: 1.0,
      postPriority: 0.9,
      pagePriority: 0.8,
    },
    blogCategories,
    blogTags,
    blogPosts,
    faqCategories,
    faqs,
    pages,
    links,
  });
}
