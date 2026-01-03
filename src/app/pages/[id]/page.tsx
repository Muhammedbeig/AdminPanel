import React from "react";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import PageEditor from "@/components/admin/pages/PageEditor";

export default async function EditPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  // ✅ FIX: Check if ID is a valid number. 
  // If it's "new" or text, return 404 so Next.js looks for the correct file.
  const pageId = parseInt(id);
  if (isNaN(pageId)) {
    return notFound();
  }

  const page = await prisma.page.findUnique({ where: { id: pageId } });
  
  if (!page) return notFound();
  
  return <PageEditor page={page} />;
}