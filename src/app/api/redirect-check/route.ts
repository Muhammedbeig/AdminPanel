import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) return NextResponse.json({ redirect: null });

  const redirect = await prisma.redirect.findUnique({
    where: { source: path, isActive: true }
  });

  if (redirect) {
    // Async update hit counter (fire and forget)
    prisma.redirect.update({
      where: { id: redirect.id },
      data: { hits: { increment: 1 } }
    }).catch(console.error);

    return NextResponse.json({ redirect });
  }

  return NextResponse.json({ redirect: null });
}