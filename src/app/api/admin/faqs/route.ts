import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

const slugify = (text: string) => 
  text.toLowerCase()
    .replace(/[^\w\s-]/g, '') 
    .replace(/\s+/g, '-')     
    .trim();

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q") || "";

  const faqs = await prisma.fAQ.findMany({
    where: { question: { contains: q } },
    include: { category: true },
    orderBy: { order: 'asc' },
  });

  return NextResponse.json({ ok: true, faqs });
}

export async function POST(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const body = await req.json();
  
  // ✅ Use provided slug OR auto-generate from question
  let slug = body.slug ? slugify(body.slug) : slugify(body.question);
  
  // Simple check to ensure uniqueness (optional: add random string if exists)
  const exists = await prisma.fAQ.findUnique({ where: { slug } });
  if (exists) slug = `${slug}-${Date.now().toString().slice(-4)}`;

  const faq = await prisma.fAQ.create({
    data: {
      question: body.question,
      slug, 
      answer: body.answer,
      categoryId: body.categoryId ? parseInt(body.categoryId) : null,
      isPublished: body.isPublished
    }
  });

  return NextResponse.json({ ok: true, faq });
}

export async function DELETE(req: Request) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await req.json();
  await prisma.fAQ.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}