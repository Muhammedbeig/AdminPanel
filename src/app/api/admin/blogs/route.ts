import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { getSession } from "@/lib/auth/session";

const ALLOWED = [Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.CONTENT_WRITER];

// ✅ Slugify Helper (Strict & Clean)
const slugify = (text: string) => 
  text
    .toString()
    .toLowerCase()
    .trim()
    .replace(/\s+/g, '-')        // Replace spaces with -
    .replace(/[^\w\-]+/g, '')    // Remove all non-word chars
    .replace(/\-\-+/g, '-');     // Replace multiple - with single -

export async function GET(req: Request) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  const { searchParams } = new URL(req.url);
  const includeTrash = searchParams.get("includeTrash") === "true";
  const status = searchParams.get("status"); // "trash", "scheduled", "published", "draft"
  const page = parseInt(searchParams.get("page") || "1");
  const limit = 20;
  const skip = (page - 1) * limit;

  // ✅ 1. Advanced Filter Logic
  let whereCondition: any = { deletedAt: null }; // Default: Show active posts only

  if (status === "trash") {
    // 🗑️ Trash View: Only show items that ARE deleted
    whereCondition = { deletedAt: { not: null } };
  } else if (includeTrash) {
    // 🕵️ Bulk View: Show Everything (Active + Deleted)
    whereCondition = {}; 
  } else if (status === "scheduled") {
    // 📅 Scheduled: Published=true, Date is in Future, Not Deleted
    whereCondition = {
      isPublished: true,
      publishedAt: { gt: new Date() },
      deletedAt: null
    };
  } else if (status === "published") {
    // 🟢 Published: Published=true, Date is Past/Now, Not Deleted
    whereCondition = {
      isPublished: true,
      publishedAt: { lte: new Date() },
      deletedAt: null
    };
  } else if (status === "draft") {
    // 🟡 Drafts: Not Published, Not Deleted
    whereCondition = { isPublished: false, deletedAt: null };
  }

  try {
    const [posts, total] = await Promise.all([
      prisma.blogPost.findMany({
        where: whereCondition,
        skip,
        take: limit,
        // ✅ Smart Sorting based on context
        orderBy: status === "trash" 
          ? { deletedAt: 'desc' } // Recently deleted first
          : status === "scheduled" 
            ? { publishedAt: 'asc' } // Soonest to publish first
            : { createdAt: "desc" }, // Newest created first
        include: {
          author: { select: { email: true, name: true, image: true } },
          category: true,
          tags: true, // ✅ Include Tags for the list view
        },
      }),
      prisma.blogPost.count({ where: whereCondition }),
    ]);

    return NextResponse.json({ ok: true, posts, total, page, pages: Math.ceil(total / limit) });
  } catch (error) {
    console.error("GET Blogs Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to load posts" }, { status: 500 });
  }
}

export async function POST(req: Request) {
  const auth = await requireRole(ALLOWED);
  if (!auth.ok) return auth.response;

  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  try {
    const body = await req.json();
    
    // ✅ 2. Published Date Logic
    // If date provided, use it. If "Publish Now" clicked without date, use NOW.
    let publishedAt = null;
    if (body.publishedAt) {
      publishedAt = new Date(body.publishedAt);
    } else if (body.isPublished) {
      publishedAt = new Date();
    }

    // ✅ 3. Create Post
    const post = await prisma.blogPost.create({
      data: {
        title: body.title,
        // Enforce strict slug generation
        slug: body.slug ? slugify(body.slug) : slugify(body.title),
        
        excerpt: body.excerpt,
        content: body.content, // Rich HTML
        featuredImage: body.featuredImage,
        categoryId: body.categoryId ? parseInt(body.categoryId) : null,
        
        // SEO Fields
        metaTitle: body.metaTitle,
        metaDescription: body.metaDescription,
        // Note: 'keywords' removed in favor of tags relation below
        
        // Author & Status
        authorId: session.id,
        isPublished: body.isPublished || false,
        publishedAt, // Correctly saves future or past date
        
        isFeatured: body.isFeatured || false,
        deletedAt: null, // Starts as active (not trash)

        // ✅ 4. Connect Tags (Array of IDs)
        tags: {
          connect: body.tags?.map((id: number) => ({ id })) || []
        }
      },
    });

    return NextResponse.json({ ok: true, post });
  } catch (error: any) {
    console.error("Create Post Error:", error);
    // Handle unique constraint violations (like duplicate slugs)
    return NextResponse.json({ ok: false, error: "Failed to create post. Slug might be duplicate." }, { status: 500 });
  }
}