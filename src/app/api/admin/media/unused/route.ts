// app/admin/src/app/api/admin/media/unused/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs";
import { unlink } from "fs/promises";

const publicDir = () => path.join(process.cwd(), "public");

function normalizeLocalUrl(input?: string | null) {
  if (!input) return null;
  const s = String(input).trim();
  if (!s) return null;

  // absolute URL -> keep pathname
  if (/^https?:\/\//i.test(s)) {
    try {
      const u = new URL(s);
      return u.pathname;
    } catch {
      return null;
    }
  }

  if (s.startsWith("/")) return s.split("?")[0].split("#")[0];
  return null;
}

function extractUploadUrlsFromText(text?: string | null) {
  const out: string[] = [];
  const s = String(text || "");
  if (!s) return out;

  // collect local urls like /uploads/... or /images/... inside html/markdown/css
  const re = /(\/(?:uploads|images)\/[^"'<> )]+)(?=[\s"'<>)]|$)/g;
  let m: RegExpExecArray | null;
  while ((m = re.exec(s)) !== null) out.push(m[1]);

  return out;
}

function safeAbsFromUrl(urlPath: string) {
  const clean = urlPath.replace(/^\/+/, "");
  if (!clean || clean.includes("..")) return null;
  return path.join(publicDir(), clean);
}

export async function GET() {
  const auth = await requireRole([Role.ADMIN, Role.EDITOR]);
  if ("response" in auth) return auth.response;

  try {
    const allMedia = await prisma.media.findMany({
      orderBy: { createdAt: "desc" },
    });

    const usedUrls = new Set<string>();

    // BLOGS
    const posts = await prisma.blogPost.findMany({
      select: { featuredImage: true, content: true },
    });
    for (const p of posts) {
      const f = normalizeLocalUrl(p.featuredImage);
      if (f) usedUrls.add(f);
      for (const u of extractUploadUrlsFromText(p.content)) usedUrls.add(u);
    }

    // PAGES
    const pages = await prisma.page.findMany({ select: { content: true } });
    for (const p of pages) {
      for (const u of extractUploadUrlsFromText(p.content)) usedUrls.add(u);
    }

    // FAQS
    const faqs = await prisma.fAQ.findMany({ select: { answer: true } });
    for (const f of faqs) {
      for (const u of extractUploadUrlsFromText(f.answer)) usedUrls.add(u);
    }

    const unusedMedia = allMedia.filter((m) => !usedUrls.has(m.url));
    const totalSize = unusedMedia.reduce((acc, curr) => acc + (curr.size || 0), 0);

    return NextResponse.json({ ok: true, media: unusedMedia, totalSize });
  } catch (error) {
    console.error("Unused Media Fetch Error:", error);
    return NextResponse.json({ ok: false, error: "Failed to scan media" }, { status: 500 });
  }
}

export async function DELETE(req: Request) {
  const auth = await requireRole([Role.ADMIN]);
  if ("response" in auth) return auth.response;

  try {
    const { ids } = await req.json();

    const files = await prisma.media.findMany({
      where: { id: { in: ids } },
      select: { id: true, url: true },
    });

    for (const file of files) {
      try {
        const abs = safeAbsFromUrl(file.url);
        if (abs && fs.existsSync(abs)) await unlink(abs);
      } catch (e) {
        console.error(`Failed to delete file: ${file.url}`, e);
      }
    }

    await prisma.media.deleteMany({ where: { id: { in: ids } } });
    return NextResponse.json({ ok: true });
  } catch {
    return NextResponse.json({ ok: false, error: "Failed to delete files" }, { status: 500 });
  }
}
