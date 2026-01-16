import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

// 1. GET: Fetch all custom links
export async function GET() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER", "DEVELOPER"]);
  if ("response" in auth) return auth.response;

  const links = await prisma.sitemapLink.findMany({
    orderBy: { path: "asc" },
  });
  return NextResponse.json({ ok: true, links });
}

// 2. POST: Add a new link
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    const { path, priority, frequency } = await req.json();
    
    // Basic validation
    if (!path.startsWith("/")) {
      return NextResponse.json({ ok: false, error: "Path must start with /" }, { status: 400 });
    }

    const link = await prisma.sitemapLink.create({
      data: {
        path,
        priority: parseFloat(priority),
        frequency,
      },
    });
    return NextResponse.json({ ok: true, link });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Link already exists or invalid data" }, { status: 400 });
  }
}

// 3. DELETE: Remove a link
export async function DELETE(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    const { id } = await req.json();
    await prisma.sitemapLink.delete({ where: { id: parseInt(id) } });
    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Delete failed" }, { status: 500 });
  }
}