import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];

export async function GET(req: Request) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // Fetch posts with Author and Category info
  const [posts, total] = await Promise.all([
    prisma.blogPost.findMany({
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        author: { select: { email: true, name: true, image: true } },
        category: true,
      },
    }),
    prisma.blogPost.count(),
  ]);

  return NextResponse.json({ ok: true, posts, total, page, pages: Math.ceil(total / limit) });
}

export async function POST(req: Request) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  // Get current user ID to set as Author
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    // Create the post
    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug: body.slug,
        excerpt: body.excerpt,
        content: body.content, // Rich HTML
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        
        // SEO
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        keywords: body.keywords,
        
        // Author
        authorId: session.id, // ✅ Auto-linked to current user
        isPublished: body.isPublished || false,
        publishedAt: body.isPublished ? new Date() : null,
      },
    });

    return NextResponse.json({ ok: true, post });
  } catch (error: any) {
    console.error("Create Post Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to create post. Slug might be duplicate." }, { status: 500 });
  }
}