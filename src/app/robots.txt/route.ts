import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const dynamic = 'force-dynamic'; // Always fetch fresh data

export async function GET() {
  // 1. Fetch custom content from DB
  const record = await prisma.robotsTxt.findFirst();
  
  // 2. Default fallback if DB is empty
  const defaultContent = `User-agent: *
Allow: /
Disallow: /api/
Disallow: /admin/

Sitemap: ${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/sitemap.xml`;

  const content = record?.content || defaultContent;

  // 3. Serve as plain text
  return new NextResponse(content, {
    headers: {
      "Content-Type": "text/plain",
      "Cache-Control": "s-maxage=3600, stale-while-revalidate", // Cache for 1 hour
    },
  });
}