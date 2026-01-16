import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function normalizePath(raw: string) {
  const s = String(raw || "").trim();
  if (!s) return "/";
  return s.startsWith("/") ? s : `/${s}`;
}

function noStore(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const path = searchParams.get("path");

  if (!path) return noStore({ redirect: null });

  const normalized = normalizePath(path);

  const redirect = await prisma.redirect.findFirst({
    where: { source: normalized, isActive: true },
  });

  if (redirect) {
    // Async update hit counter (fire and forget)
    prisma.redirect.update({
      where: { id: redirect.id },
      data: { hits: { increment: 1 } }
    }).catch(console.error);

    return noStore({ redirect });
  }

  return noStore({ redirect: null });
}
