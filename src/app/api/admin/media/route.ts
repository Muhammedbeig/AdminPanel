import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";
import { writeFile, mkdir, unlink, rmdir } from "fs/promises";
import path from "path";
import fs from "fs";

// Helper: Get full path
const getUploadPath = () => path.join(process.cwd(), "public");

// Helper: Recursive delete for physical files
async function deleteFolderContents(folderId: number) {
  // 1. Find all subfolders and files
  const folder = await prisma.mediaFolder.findUnique({
    where: { id: folderId },
    include: { files: true, children: true }
  });

  if (!folder) return;

  // 2. Delete Files in this folder
  for (const file of folder.files) {
    try {
      const filePath = path.join(getUploadPath(), file.url);
      if (fs.existsSync(filePath)) await unlink(filePath);
    } catch (e) { console.error("File delete error:", e); }
  }

  // 3. Recurse for subfolders
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

  const folders = await prisma.mediaFolder.findMany({
    where: { parentId: folderId },
    orderBy: { name: "asc" }
  });

  const files = await prisma.media.findMany({
    where: { folderId: folderId },
    orderBy: { createdAt: "desc" }
  });

  // Breadcrumbs
  const breadcrumbs = [];
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
  
  // Organize by Year/Month physically or flat? Let's keep flat for simplicity in this code
  const uploadDir = path.join(process.cwd(), "public/uploads");
  await mkdir(uploadDir, { recursive: true });

  const uniqueName = `${Date.now()}-${file.name.replace(/\s/g, "-")}`;
  const filePath = path.join(uploadDir, uniqueName);
  await writeFile(filePath, buffer);

  const media = await prisma.media.create({
    data: {
      filename: file.name,
      url: `/uploads/${uniqueName}`,
      mimeType: file.type,
      size: file.size,
      folderId
    }
  });

  return NextResponse.json({ ok: true, media });
}

// ✅ DELETE: Handle Deletion
export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id, type } = await req.json();

  if (type === "file") {
    const file = await prisma.media.findUnique({ where: { id } });
    if (file) {
      try {
        const filePath = path.join(getUploadPath(), file.url);
        if (fs.existsSync(filePath)) await unlink(filePath);
      } catch (e) {}
      await prisma.media.delete({ where: { id } });
    }
  } else if (type === "folder") {
    // Recursive Delete
    await deleteFolderContents(id);
    // Prisma cascading delete should handle DB records if schema is set up, 
    // but safety delete manually for files is good.
    // We assume 'onDelete: Cascade' in schema or we delete explicitly.
    // Let's rely on Prisma API deleting relations if schema allows, otherwise:
    await prisma.media.deleteMany({ where: { folderId: id } }); // Delete immediate files
    await prisma.mediaFolder.delete({ where: { id } }); // Will fail if children exist unless schema has Cascade
  }

  return NextResponse.json({ ok: true });
}

// ✅ PUT: Handle Rename
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