// src/app/api/uploads/route.ts
import { NextResponse } from "next/server";
import { requireRole } from "@/lib/auth/require";
import { Role } from "@prisma/client";
import path from "path";
import fs from "fs/promises";

export const runtime = "nodejs";

function safeFolder(input: string) {
  // keep it simple + safe
  const cleaned = (input || "")
    .replaceAll("\\", "/")
    .split("/")
    .filter(Boolean)
    .filter((p) => p !== "." && p !== "..")
    .join("/");
  return cleaned || "misc";
}

export async function POST(req: Request) {
  const guard = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if (!guard.ok) return NextResponse.json({ ok: false, error: guard.error }, { status: guard.status });

  const form = await req.formData();
  const file = form.get("file");
  const folderRaw = String(form.get("folder") || "misc");

  if (!(file instanceof File)) {
    return NextResponse.json({ ok: false, error: "Missing file" }, { status: 400 });
  }

  const folder = safeFolder(folderRaw);
  const bytes = Buffer.from(await file.arrayBuffer());

  const ext = (file.name.split(".").pop() || "png").toLowerCase().replace(/[^a-z0-9]/g, "");
  const safeExt = ["png", "jpg", "jpeg", "webp", "svg"].includes(ext) ? ext : "png";
  const filename = `${Date.now()}-${Math.random().toString(16).slice(2)}.${safeExt}`;

  const dir = path.join(process.cwd(), "public", "uploads", folder);
  await fs.mkdir(dir, { recursive: true });
  await fs.writeFile(path.join(dir, filename), bytes);

  const url = `/uploads/${folder}/${filename}`;
  return NextResponse.json({ ok: true, url });
}
