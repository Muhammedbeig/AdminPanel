// app/admin/src/app/api/admin/upload-file/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { prisma } from "@/lib/db/prisma";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MIME_BY_EXT: Record<string, string> = {
  png: "image/png",
  jpg: "image/jpeg",
  jpeg: "image/jpeg",
  webp: "image/webp",
  gif: "image/gif",
  svg: "image/svg+xml",
  ico: "image/x-icon",
};

function mimeFromExt(ext: string, fallback?: string) {
  const e = (ext || "").toLowerCase().replace(".", "");
  return fallback || MIME_BY_EXT[e] || "application/octet-stream";
}

export async function POST(req: Request) {
  try {
    const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
    if ("response" in g) return g.response;

    const form = await req.formData();
    const file = form.get("file");
    const siteKey = String(form.get("siteKey") || "livesoccerr");
    const kind = String(form.get("kind") || "misc");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExts = ["png", "jpg", "jpeg", "webp", "svg", "ico", "gif"];
    const finalExt = safeExts.includes(ext) ? ext : "png";
    const filename = `${Date.now()}-${Math.random().toString(36).slice(2)}.${finalExt}`;

    // Save into: /public/uploads/<siteKey>/<kind>/<filename>
    const relDir = path.join("uploads", siteKey, kind);
    const absDir = path.join(process.cwd(), "public", relDir);
    await fs.mkdir(absDir, { recursive: true });

    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(absDir, filename), buffer);

    const webPath = relDir.split(path.sep).join("/");
    const url = `/${webPath}/${filename}`;

    // ✅ IMPORTANT: also insert into prisma.media so Media Library can see it
    // Avoid duplicates (rare but safe)
    const exists = await prisma.media.findFirst({ where: { url } });
    if (!exists) {
      await prisma.media.create({
        data: {
          filename: file.name,
          url,
          mimeType: mimeFromExt(finalExt, file.type || undefined),
          size: typeof file.size === "number" ? file.size : buffer.length,
          folderId: null,
        },
      });
    }

    return NextResponse.json({ ok: true, url });
  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ ok: false, error: error?.message || "Server Error" }, { status: 500 });
  }
}
