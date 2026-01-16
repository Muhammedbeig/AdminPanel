import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  // 1. Allow Writers to enter (permission checked below)
  const auth = await requireRole([Role.ADMIN, Role.EDITOR, Role.CONTENT_WRITER]);
  if ("response" in auth) return auth.response;

  const { id } = await params;
  const user = auth.session;

  try {
    // 2. Fetch Post to check ownership
    const post = await prisma.blogPost.findUnique({
        where: { id: parseInt(id) }
    });

    if (!post) return NextResponse.json({ error: "Not found" }, { status: 404 });

    // 3. STRICT SECURITY: Writers can only restore THEIR OWN posts
    if (user.role === Role.CONTENT_WRITER && post.authorId !== user.id) {
        return NextResponse.json(
            { error: "Forbidden: You can only restore your own posts." },
            { status: 403 }
        );
    }

    // 4. Perform Restore
    await prisma.blogPost.update({
      where: { id: parseInt(id) },
      data: { deletedAt: null },
    });
    
    return NextResponse.json({ ok: true, message: "Post restored successfully" });

  } catch (error) {
    console.error("Restore Error:", error);
    return NextResponse.json(
      { ok: false, error: "Failed to restore post." }, 
      { status: 500 }
    );
  }
}