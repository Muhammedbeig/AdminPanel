import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

export async function POST(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
  if (!g.ok) return g.response;

  const form = await req.formData();
  const file = form.get("file");

  const siteKey = String(form.get("siteKey") || "livesoccerr");
  const kind = String(form.get("kind") || "misc"); // logo | og | twitter | misc

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file (form-data: file)" }, { status: 400 });
  }

  const ext = (file.name.split(".").pop() || "png").toLowerCase();
  const safeExt = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext) ? ext : "png";

  const bytes = Buffer.from(await file.arrayBuffer());
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

  const relDir = path.join("uploads", siteKey, kind);
  const absDir = path.join(process.cwd(), "public", relDir);
  await fs.mkdir(absDir, { recursive: true });

  const absPath = path.join(absDir, filename);
  await fs.writeFile(absPath, bytes);

  const url = `/${relDir.replaceAll("\\", "/")}/${filename}`;
  return NextResponse.json({ ok: true, url }, { status: 200 });
}
