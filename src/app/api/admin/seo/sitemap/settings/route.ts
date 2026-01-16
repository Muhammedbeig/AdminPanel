import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

export async function GET() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  // Get settings or create default if not exists
  let settings = await prisma.sitemapSettings.findFirst();
  if (!settings) {
    settings = await prisma.sitemapSettings.create({
      data: { homePriority: 1.0, postPriority: 0.9, pagePriority: 0.8 }
    });
  }
  return NextResponse.json({ ok: true, settings });
}

export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const data = await req.json();
  
  // Update the first record (Singleton pattern)
  const first = await prisma.sitemapSettings.findFirst();
  const id = first ? first.id : -1;

  const settings = await prisma.sitemapSettings.upsert({
    where: { id },
    create: {
      homePriority: parseFloat(data.home),
      postPriority: parseFloat(data.posts),
      pagePriority: parseFloat(data.pages),
    },
    update: {
      homePriority: parseFloat(data.home),
      postPriority: parseFloat(data.posts),
      pagePriority: parseFloat(data.pages),
    }
  });

  return NextResponse.json({ ok: true, settings });
}