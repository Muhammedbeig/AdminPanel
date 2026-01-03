import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs";
import { unlink } from "fs/promises";

// Helper: Get full upload path
const getUploadPath = () => path.join(process.cwd(), "public");

export async function GET(req: Request) {
  const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
  if (!auth.ok) return auth.response;

  try {
    // 1. Fetch all Media
    const allMedia = await prisma.media.findMany({
      orderBy: { createdAt: "desc" }
    });

    // 2. Fetch all Posts (Featured Image + Content)
    const allPosts = await prisma.blogPost.findMany({
      select: {
        featuredImage: true,
        content: true
      }
    });

    // 3. Create a Set of USED URLs
    const usedUrls = new Set<string>();

    allPosts.forEach(post => {
      // Check Featured Image
      if (post.featuredImage) {
        usedUrls.add(post.featuredImage);
      }
      
      // Check Content (Regex to extract src="/uploads/...")
      const imgRegex = /src=["'](\/uploads\/[^"']+)["']/g;
      let match;
      while ((match = imgRegex.exec(post.content || "")) !== null) {
        usedUrls.add(match[1]);
      }
    });

    // 4. Filter Unused Media
    const unusedMedia = allMedia.filter(m => !usedUrls.has(m.url));

    // Calculate Stats
    const totalSize = unusedMedia.reduce((acc, curr) => acc + curr.size, 0);

    return NextResponse.json({ ok: true, media: unusedMedia, totalSize });
  } catch (error) {
    console.error("Unused Media Fetch Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to scan media" }, { status: 500 });
  }
}

// BULK DELETE
export async function DELETE(req: Request) {
  const auth = await requireRole([Role.ADMIN]); // Only Admin can bulk delete
  if (!auth.ok) return auth.response;

  try {
    const { ids } = await req.json(); // Array of Media IDs

    // Get files to delete
    const filesToDelete = await prisma.media.findMany({
      where: { id: { in: ids } }
    });

    // 1. Delete from Disk
    for (const file of filesToDelete) {
      try {
        const filePath = path.join(getUploadPath(), file.url);
        if (fs.existsSync(filePath)) {
          await unlink(filePath);
        }
      } catch (e) {
        console.error(`Failed to delete file: ${file.url}`, e);
      }
    }

    // 2. Delete from DB
    await prisma.media.deleteMany({
      where: { id: { in: ids } }
    });

    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ ok: false, error: "Failed to delete files" }, { status: 500 });
  }
}