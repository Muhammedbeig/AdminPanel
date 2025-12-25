import { NextResponse } from "next/server";
import path from "path";
import { mkdir, writeFile } from "fs/promises";
import crypto from "crypto";

import { requireRole } from "@/lib/auth/require";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function safeName(name: string) {
  return (name || "file").replace(/[^a-zA-Z0-9._-]/g, "_");
}

function guardFailToResponse(fail: any) {
  const status = typeof fail?.status === "number" ? fail.status : 401;
  const msg =
    (typeof fail?.message === "string" && fail.message) ||
    (typeof fail?.error === "string" && fail.error) ||
    (typeof fail?.reason === "string" && fail.reason) ||
    "Unauthorized";

  return NextResponse.json({ ok: false, error: msg }, { status });
}

export async function POST(req: Request) {
  // ✅ works whether requireRole expects (req) OR (req, roles)
  const guard = await (requireRole as any)(req, [
    Role.ADMIN,
    Role.EDITOR,
    Role.SEO_MANAGER,
    Role.DEVELOPER,
  ]);

  if (!guard?.ok) return guardFailToResponse(guard);

  try {
    const form = await req.formData();
    const file = form.get("file");

    if (!(file instanceof File)) {
      return NextResponse.json({ ok: false, error: "No file provided." }, { status: 400 });
    }

    const folder = String(form.get("folder") || "uploads").trim() || "uploads";

    // limits
    const maxBytes = 5 * 1024 * 1024; // 5MB
    if (file.size > maxBytes) {
      return NextResponse.json({ ok: false, error: "File too large (max 5MB)." }, { status: 400 });
    }

    const ext = path.extname(file.name || "").toLowerCase();
    const allowed = [".png", ".jpg", ".jpeg", ".webp", ".svg"];
    if (ext && !allowed.includes(ext)) {
      return NextResponse.json(
        { ok: false, error: "Only png, jpg, jpeg, webp, svg allowed." },
        { status: 400 }
      );
    }

    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes); // ✅ ArrayBuffer overload (1 arg)

    const filename = `${Date.now()}-${crypto.randomBytes(6).toString("hex")}-${safeName(file.name)}`;

    const publicDir = path.join(process.cwd(), "public");
    const uploadDir = path.join(publicDir, folder);

    await mkdir(uploadDir, { recursive: true });

    const fullPath = path.join(uploadDir, filename);
    await writeFile(fullPath, buffer);

    return NextResponse.json({ ok: true, url: `/${folder}/${filename}` });
  } catch (e: any) {
    return NextResponse.json(
      { ok: false, error: e?.message || "Upload failed." },
      { status: 500 }
    );
  }
}
