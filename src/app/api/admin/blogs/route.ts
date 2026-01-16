import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { permissions } from "@/lib/auth/permissions";
import { Role } from "@prisma/client";

// ✅ SAFEGUARD: Allow all staff to ENTER the route (Reads). 
// Write permissions are checked specifically in POST/PUT/DELETE.
const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER, Role.DEVELOPER];

const slugify = (text: string) => 
  text.toString().toLowerCase().trim().replace(/\s+/g, '-').replace(/[^\w\-]+/g, '').replace(/\-\-+/g, '-');

export async function GET(req: Request) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;

  const user = auth.session;
  const { searchParams } = new URL(req.url);
  const includeTrash = searchParams.get("includeTrash") === "true";
  const status = searchParams.get("status");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  let whereCondition: any = { deletedAt: null };

  if (status === "trash") {
    whereCondition = { deletedAt: { not: null } };
    // Writers can only see THEIR own trash
    if (user.role === Role.CONTENT_WRITER) {
      whereCondition.authorId = user.id;
    }
  } else if (includeTrash) {
    whereCondition = {};
  } else if (status === "scheduled") {
    whereCondition = { isPublished: true, publishedAt: { gt: new Date() }, deletedAt: null };
  } else if (status === "published") {
    whereCondition = { isPublished: true, publishedAt: { lte: new Date() }, deletedAt: null };
  } else if (status === "draft") {
    whereCondition = { isPublished: false, deletedAt: null };
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereCondition,
        skip,
        take: limit,
        orderBy: status === "trash" ? { deletedAt: 'desc' } : status === "scheduled" ? { publishedAt: 'asc' } : { createdAt: "desc" },
        include: { author: { select: { email: true, name: true, image: true } }, category: true, tags: true },
      }),
      prisma.blogPost.count({ where: whereCondition }),
    ]);
    
    return NextResponse.json({ ok: true, posts, total, page, pages: Math.ceil(total / limit), userRole: user.role });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(ALLOWED);
  if ("response" in auth) return auth.response;
  
  const user = auth.session;
  const body = await req.json();

  try {
    // 🔒 Permission Check (Blocks Developer here)
    if (!permissions.canCreatePost(user)) {
       return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    let isPublished = body.isPublished || false;
    // 🔒 Writers forced to Draft
    if (isPublished && !permissions.canPublishPost(user)) {
       isPublished = false; 
    }

    let publishedAt = null;
    if (body.publishedAt) publishedAt = new Date(body.publishedAt);
    else if (isPublished) publishedAt = new Date();

    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        slug: body.slug ? slugify(body.slug) : slugify(body.title),
        excerpt: body.excerpt,
        content: body.content, 
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        authorId: user.id,
        isPublished: isPublished,
        publishedAt,
        isFeatured: body.isFeatured || false,
        deletedAt: null,
        tags: { connect: body.tags?.map((id: number) => ({ id })) || [] }
      },
    });
    return NextResponse.json({ ok: true, post });
  } catch (error: any) {
    return NextResponse.json({ ok: false, error: "Failed to create post." }, { status: 500 });
  }
}