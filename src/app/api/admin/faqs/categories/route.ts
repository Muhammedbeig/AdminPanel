import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function GET() {
  const categories = await prisma.fAQCategory.findMany({ orderBy: { name: 'asc' }, include: { _count: { select: { faqs: true } } } });
  return NextResponse.json({ ok: true, categories });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { name } = await req.json();
  const slug = name.toLowerCase().replace(/ /g, '-').replace(/[^\w-]+/g, '');
  const category = await prisma.fAQCategory.create({ data: { name, slug } });
  return NextResponse.json({ ok: true, category });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await req.json();
  await prisma.fAQCategory.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}