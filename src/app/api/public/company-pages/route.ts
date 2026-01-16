import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const RESERVED = new Set([
  "admin",
  "api",
  "blog",
  "faqs",
  "contact",
  "privacy-policy",
  "terms-of-service",
  "sports",
  "match",
  "player",
  "football",
  "robots.txt",
  "sitemap.xml",
  "sitemap",
]);

export async function GET() {
  const pages = await prisma.page.findMany({
    where: { isPublished: true },
    select: { title: true, slug: true, updatedAt: true },
    orderBy: { updatedAt: "desc" },
  });

  const filtered = pages.filter((p) => p.slug && !RESERVED.has(p.slug));

  return NextResponse.json({ ok: true, pages: filtered });
}
