import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

function normalizeSlug(raw: string) {
  return String(raw || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

export async function GET(_req: Request, props: Props) {
  const { slug: raw } = await props.params;
  const slug = normalizeSlug(raw);

  if (!slug) return NextResponse.json({ ok: false, error: "Missing slug" }, { status: 400 });

  const page = await prisma.page.findFirst({
    where: { slug, isPublished: true },
    select: {
      title: true,
      slug: true,
      content: true,
      metaTitle: true,
      metaDescription: true,
      updatedAt: true,
    },
  });

  if (!page) return NextResponse.json({ ok: false, error: "Not found" }, { status: 404 });

  return NextResponse.json({ ok: true, page });
}
