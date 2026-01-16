import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

// GET: List all redirects
export async function GET() {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const redirects = await prisma.redirect.findMany({
    orderBy: { createdAt: 'desc' }
  });
  return NextResponse.json({ ok: true, redirects });
}

// POST: Create new redirect
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    const { source, destination, type } = await req.json();

    if (source === destination) {
      return NextResponse.json({ ok: false, error: "Infinite Loop Detected" }, { status: 400 });
    }

    const redirect = await prisma.redirect.create({
      data: {
        source: source.startsWith("/") ? source : `/${source}`,
        destination: destination.startsWith("http") ? destination : (destination.startsWith("/") ? destination : `/${destination}`),
        type: parseInt(type),
        isActive: true
      }
    });
    return NextResponse.json({ ok: true, redirect });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Redirect source already exists" }, { status: 400 });
  }
}

// DELETE: Remove
export async function DELETE(req: Request) {
  const auth = await requireRole(["ADMIN", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  const { id } = await req.json();
  await prisma.redirect.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}