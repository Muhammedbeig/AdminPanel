import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER];

// Helper to clean slugs
const slugify = (text: string) => 
  text.toString().toLowerCase().trim()
    .replace(/\s+/g, '-')
    .replace(/[^\w\-]+/g, '')
    .replace(/\-\-+/g, '-');

// GET: List all pages
export async function GET() {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  try {
    const pages = await prisma.page.findMany({ 
      orderBy: { title: "asc" } 
    });
    return NextResponse.json({ ok: true, pages });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to fetch pages" }, { status: 500 });
  }
}

// POST: Create a new page
export async function POST(req: Request) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const slug = body.slug ? slugify(body.slug) : slugify(body.title);

    const existing = await prisma.page.findUnique({ where: { slug } });
    if (existing) {
      return NextResponse.json({ ok: false, error: "A page with this URL slug already exists." }, { status: 400 });
    }

    const page = await prisma.page.create({
      data: {
        title: body.title,
        slug,
        content: body.content || "",
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        isPublished: body.isPublished || false,
      }
    });

    return NextResponse.json({ ok: true, page });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to create page." }, { status: 500 });
  }
}

// ✅ NEW: Bulk Delete
export async function DELETE(req: Request) {
  const auth = await requireRole([Role.ADMIN]); // Only Admin can delete pages
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const ids = body.ids; // Expecting array of IDs

    if (!ids || !Array.isArray(ids) || ids.length === 0) {
      return NextResponse.json({ ok: false, error: "No IDs provided" }, { status: 400 });
    }

    await prisma.page.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to delete pages" }, { status: 500 });
  }
}