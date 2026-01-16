import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

// Helper to extract URLs from HTML/Markdown content
const extractUrls = (text: string) => {
  const regex = /href=["'](https?:\/\/[^"']+|^\/[^"']+)["']/g;
  const matches = [];
  let match;
  while ((match = regex.exec(text)) !== null) {
    matches.push(match[1]);
  }
  return matches;
};

// GET: List all broken links
export async function GET() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const brokenLinks = await prisma.brokenLink.findMany({
    orderBy: { checkedAt: 'desc' }
  });

  return NextResponse.json({ ok: true, links: brokenLinks });
}

// POST: Trigger a Scan
export async function POST() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    // 1. Clear previous report
    await prisma.brokenLink.deleteMany();

    // 2. Fetch all published posts
    const posts = await prisma.blogPost.findMany({
      where: { isPublished: true, deletedAt: null },
      select: { title: true, slug: true, content: true }
    });

    const foundBroken: any[] = [];

    // 3. Scan Content
    for (const post of posts) {
      if (!post.content) continue;
      
      const urls = extractUrls(post.content);
      
      // Check urls in batches to avoid overwhelming network
      for (const url of urls) {
        try {
          // If relative link, prepend domain
          const checkUrl = url.startsWith("/") 
            ? `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}${url}` 
            : url;

          const res = await fetch(checkUrl, { method: "HEAD", signal: AbortSignal.timeout(5000) });
          
          if (res.status >= 400) {
            foundBroken.push({
              linkUrl: url,
              sourceSlug: post.slug,
              sourceTitle: post.title,
              statusCode: res.status
            });
          }
        } catch (error) {
          // Network error or timeout usually means broken/down
          foundBroken.push({
            linkUrl: url,
            sourceSlug: post.slug,
            sourceTitle: post.title,
            statusCode: 0 // 0 indicates network error/timeout
          });
        }
      }
    }

    // 4. Save results to DB
    if (foundBroken.length > 0) {
      await prisma.brokenLink.createMany({ data: foundBroken });
    }

    return NextResponse.json({ ok: true, count: foundBroken.length });

  } catch (e) {
    return NextResponse.json({ ok: false, error: "Scan failed" }, { status: 500 });
  }
}