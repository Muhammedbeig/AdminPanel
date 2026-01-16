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

  const now = new Date();
  const post = await prisma.blogPost.findFirst({
    where: {
      slug,
      isPublished: true,
      deletedAt: null,
      OR: [{ publishedAt: null }, { publishedAt: { lte: now } }],
    },
    select: {
      id: true,
      title: true,
      slug: true,
      excerpt: true,
      content: true,
      featuredImage: true,
      metaTitle: true,
      metaDescription: true,
      ogTitle: true,
      ogDescription: true,
      ogImage: true,
      publishedAt: true,
      updatedAt: true,
      category: { select: { name: true, slug: true } },
      tags: { select: { name: true, slug: true } },
      author: { select: { name: true } },
    },
  });

  if (!post) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, post });
}
