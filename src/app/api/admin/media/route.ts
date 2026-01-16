// app/admin/src/app/api/admin/media/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { writeFile, mkdir, unlink } from "fs/promises";
import path from "path";
import fs from "fs";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// public root
const publicDir = () => path.join(process.cwd(), "public");
const uploadsAbs = () => path.join(publicDir(), "uploads");

function safePublicFileAbs(urlPath: string) {
  // urlPath like "/uploads/xxx.png"
  const clean = String(urlPath || "")
    .trim()
    .split("?")[0]
    .split("#")[0]
    .replace(/^\/+/, ""); // remove leading "/"
  if (!clean || clean.includes("..")) return null;
  return path.join(publicDir(), clean);
}

const MIME_BY_EXT: Record<string, string> = {
  ".png": "image/png",
  ".jpg": "image/jpeg",
  ".jpeg": "image/jpeg",
  ".webp": "image/webp",
  ".gif": "image/gif",
  ".svg": "image/svg+xml",
  ".ico": "image/x-icon",
  ".mp4": "video/mp4",
  ".webm": "video/webm",
  ".pdf": "application/pdf",
};

function mimeFromPath(p: string) {
  const ext = path.extname(p).toLowerCase();
  return MIME_BY_EXT[ext] || "application/octet-stream";
}

async function walkDir(absDir: string, out: string[] = [], limit = 50000) {
  if (out.length >= limit) return out;

  let entries: fs.Dirent[] = [];
  try {
    entries = await fs.promises.readdir(absDir, { withFileTypes: true });
  } catch {
    return out;
  }

  for (const ent of entries) {
    if (out.length >= limit) break;

    const abs = path.join(absDir, ent.name);
    if (ent.isDirectory()) {
      await walkDir(abs, out, limit);
      continue;
    }
    if (ent.isFile()) out.push(abs);
  }

  return out;
}

let LAST_INDEX_AT = 0;
async function maybeIndexUploadsOnceInAWhile() {
  // throttle so MediaLibrary folder navigation doesn’t re-index every time
  const now = Date.now();
  if (now - LAST_INDEX_AT < 60_000) return; // 60s
  LAST_INDEX_AT = now;

  // If uploads folder doesn't exist, nothing to index
  if (!fs.existsSync(uploadsAbs())) return;

  // Get existing media URLs (only those inside /uploads to keep it light)
  const existing = await prisma.media.findMany({
    where: { url: { startsWith: "/uploads/" } },
    select: { url: true },
  });
  const existingSet = new Set(existing.map((x) => x.url));

  // Scan /public/uploads/**/* and create missing DB rows
  const filesAbs = await walkDir(uploadsAbs(), [], 50000);

  const toCreate: Array<{
    filename: string;
    url: string;
    mimeType: string;
    size: number;
    folderId: number | null;
  }> = [];

  for (const abs of filesAbs) {
    // convert abs path -> url "/uploads/...."
    const relFromPublic = path.relative(publicDir(), abs).split(path.sep).join("/");
    const url = `/${relFromPublic}`;

    if (existingSet.has(url)) continue;

    let statSize = 0;
    try {
      const st = await fs.promises.stat(abs);
      statSize = st.size || 0;
    } catch {}

    toCreate.push({
      filename: path.basename(abs),
      url,
      mimeType: mimeFromPath(abs),
      size: statSize,
      folderId: null,
    });

    existingSet.add(url);
  }

  // Bulk insert in chunks
  const chunkSize = 500;
  for (let i = 0; i < toCreate.length; i += chunkSize) {
    const chunk = toCreate.slice(i, i + chunkSize);
    if (!chunk.length) continue;
    await prisma.media.createMany({ data: chunk });
  }
}

// Helper: Recursive delete for physical files
async function deleteFolderContents(folderId: number) {
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: folderId },
    include: { files: true, children: true },
  });
  if (!folder) return;

  for (const file of folder.files) {
    try {
      const abs = safePublicFileAbs(file.url);
      if (abs && fs.existsSync(abs)) await unlink(abs);
    } catch (e) {
      console.error("File delete error:", e);
    }
  }

  for (const child of folder.children) {
    await deleteFolderContents(child.id);
  }
}

export async function GET(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const folderIdParam = searchParams.get("folderId");
  const folderId = folderIdParam && folderIdParam !== "null" ? parseInt(folderIdParam) : null;

  // ✅ auto-index uploads so ALL images show in library even if uploaded elsewhere
  // run only when viewing root (folderId=null) to keep it fast
  if (folderId === null) {
    try {
      await maybeIndexUploadsOnceInAwhile();
    } catch (e) {
      console.warn("[media] upload indexing failed:", e);
    }
  }

  const folders = await prisma.mediaFolder.findMany({
    where: { parentId: folderId },
    orderBy: { name: "asc" },
  });

  const files = await prisma.media.findMany({
    where: { folderId },
    orderBy: { createdAt: "desc" },
  });

  // Breadcrumbs
  const breadcrumbs: Array<{ id: number; name: string }> = [];
  let currentId = folderId;
  while (currentId) {
    const f = await prisma.mediaFolder.findUnique({ where: { id: currentId } });
    if (f) {
      breadcrumbs.unshift({ id: f.id, name: f.name });
      currentId = f.parentId;
    } else break;
  }

  return NextResponse.json({ ok: true, folders, files, breadcrumbs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const formData = await req.formData();
  const type = formData.get("type");

  if (type === "folder") {
    const name = formData.get("name") as string;
    const parentIdStr = formData.get("parentId") as string;
    const parentId = parentIdStr && parentIdStr !== "null" ? parseInt(parentIdStr) : null;

    const folder = await prisma.mediaFolder.create({ data: { name, parentId } });
    return NextResponse.json({ ok: true, folder });
  }

  const file = formData.get("file") as File;
  const folderIdStr = formData.get("folderId") as string;
  const folderId = folderIdStr && folderIdStr !== "null" ? parseInt(folderIdStr) : null;

  if (!file) return NextResponse.json({ error: "No file" }, { status: 400 });

  const bytes = await file.arrayBuffer();
  const buffer = Buffer.from(bytes);

  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  const media = await prisma.media.create({
    data: {
      filename: file.name,
      url: `/uploads/${uniqueName}`,
      mimeType: file.type || mimeFromPath(filePath),
      size: file.size,
      folderId,
    },
  });

  return NextResponse.json({ ok: true, media });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type } = await req.json();

  if (type === "file") {
    const file = await prisma.media.findUnique({ where: { id } });
    if (file) {
      try {
        const abs = safePublicFileAbs(file.url);
        if (abs && fs.existsSync(abs)) await unlink(abs);
      } catch {}
      await prisma.media.delete({ where: { id } });
    }
  } else if (type === "folder") {
    await deleteFolderContents(id);

    // delete DB records
    await prisma.media.deleteMany({ where: { folderId: id } });
    await prisma.mediaFolder.delete({ where: { id } });
  }

  return NextResponse.json({ ok: true });
}

export async function PUT(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type, name } = await req.json();

  if (type === "file") {
    await prisma.media.update({ where: { id }, data: { filename: name } });
  } else {
    await prisma.mediaFolder.update({ where: { id }, data: { name } });
  }

  return NextResponse.json({ ok: true });
}

// internal helper name typo-safe
async function maybeIndexUploadsOnceInAwhile() {
  return maybeIndexUploadsOnceInAWhile();
}
