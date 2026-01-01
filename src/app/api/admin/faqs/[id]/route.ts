import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { getSessionUser } from "@/lib/auth/session";

export async function PUT(req: Request, { params }: { params: { id: string } }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  
  const { id } = params;
  const body = await req.json();

  await prisma.fAQ.update({
    where: { id: parseInt(id) },
    data: {
      question: body.question,
      answer: body.answer,
      categoryId: body.categoryId ? parseInt(body.categoryId) : null,
      isPublished: body.isPublished
    }
  });

  return NextResponse.json({ ok: true });
}