import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

// ✅ Force Node.js runtime
export const runtime = "nodejs";

export async function POST(req: Request) {
  try {
    // 1. Auth Check
    const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
    if (!g.ok) {
      return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 403 });
    }

    // 2. Parse Form
    const form = await req.formData();
    const file = form.get("file");
    const siteKey = String(form.get("siteKey") || "livesoccerr");
    const kind = String(form.get("kind") || "misc");

    if (!file || !(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided" }, { status: 400 });
    }

    // 3. Setup File Params
    const ext = (file.name.split(".").pop() || "png").toLowerCase();
    const safeExts = ["png", "jpg", "jpeg", "webp", "svg", "ico"];
    const finalExt = safeExts.includes(ext) ? ext : "png";
    const filename = `${Date.now()}-${Math.random().toString(36).substring(7)}.${finalExt}`;

    // 4. Save File
    const relDir = path.join("uploads", siteKey, kind);
    const absDir = path.join(process.cwd(), "public", relDir);
    
    await fs.mkdir(absDir, { recursive: true });
    
    const buffer = Buffer.from(await file.arrayBuffer());
    await fs.writeFile(path.join(absDir, filename), buffer);

    // 5. Success
    const webPath = relDir.split(path.sep).join("/");
    return NextResponse.json({ ok: true, url: `/${webPath}/${filename}` });

  } catch (error: any) {
    console.error("Upload Error:", error);
    return NextResponse.json({ ok: false, error: error.message || "Server Error" }, { status: 500 });
  }
}