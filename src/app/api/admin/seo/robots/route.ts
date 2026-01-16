import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

// GET: Fetch current content
export async function GET() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const record = await prisma.robotsTxt.findFirst();
  return NextResponse.json({ ok: true, content: record?.content || "" });
}

// POST: Save new content
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const { content } = await req.json();

  // Upsert: Update if exists, Create if not (Singleton pattern)
  const first = await prisma.robotsTxt.findFirst();
  const id = first ? first.id : -1;

  await prisma.robotsTxt.upsert({
    where: { id },
    create: { content },
    update: { content }
  });

  return NextResponse.json({ ok: true });
}