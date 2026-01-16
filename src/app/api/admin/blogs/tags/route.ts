import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";

// Helper for slug generation
const slugify = (text: string) => 
  text.toLowerCase().replace(/[^\w\s-]/g, '').replace(/\s+/g, '-').trim();

// GET
export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const tags = await prisma.blogTag.findMany({
    where: {
      OR: [ { name: { contains: q } }, { slug: { contains: q } } ]
    },
    include: { _count: { select: { posts: true } } },
    orderBy: { name: 'asc' }
  });

  return NextResponse.json({ ok: true, tags });
}

// POST
export async function POST(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const name = body.name.trim();
    const slug = slugify(body.name);

    // Validation: Check duplicate
    const existing = await prisma.blogTag.findFirst({ where: { OR: [{ name }, { slug }] } });
    if (existing) return NextResponse.json({ ok: true, tag: existing }); // Return existing if found

    const tag = await prisma.blogTag.create({ data: { name, slug, description: body.description } });
    return NextResponse.json({ ok: true, tag });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to create tag." }, { status: 500 });
  }
}

// ✅ UPDATED: DELETE (Bulk)
export async function DELETE(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR"]);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const ids = body.ids ? body.ids : (body.id ? [body.id] : []);

    if (ids.length === 0) return NextResponse.json({ ok: false, error: "No IDs provided" }, { status: 400 });
    
    // Prisma implicit many-to-many handles removing relations automatically from BlogPost
    await prisma.blogTag.deleteMany({ where: { id: { in: ids } } });

    return NextResponse.json({ ok: true });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Failed to delete tags." }, { status: 500 });
  }
}

// PUT
export async function PUT(req: Request) {
  const auth = await requireRole(["ADMIN", "EDITOR", "SEO_MANAGER"]);
  if ("response" in auth) return auth.response;

  try {
    const body = await req.json();
    const { id, name, description, slug } = body;
    const finalSlug = slugify(slug || name);

    const tag = await prisma.blogTag.update({
      where: { id },
      data: { name, description, slug: finalSlug }
    });

    return NextResponse.json({ ok: true, tag });
  } catch (e) {
    return NextResponse.json({ ok: false, error: "Update failed" }, { status: 500 });
  }
}