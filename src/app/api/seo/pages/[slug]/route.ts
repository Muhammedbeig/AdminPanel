import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

// ✅ Import ALL templates
import SEO_PAGE_TERMS_TEMPLATE from "@/livesoccerr/templates/seo-page.terms-of-service";
import SEO_PAGE_PRIVACY_TEMPLATE from "@/livesoccerr/templates/seo-page.privacy-policy";
import SEO_PAGE_CONTACT_TEMPLATE from "@/livesoccerr/templates/seo-page.contact"; 

export const runtime = "nodejs";

// ✅ Fix for Next.js 16: Type the params as a Promise
type Props = {
  params: Promise<{ slug: string }>;
};

export async function GET(req: Request, props: Props) {
  try {
    const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
    if (!g.ok) return g.response;

    // ✅ Fix: Await the params object (Required in Next.js 15/16)
    const params = await props.params;
    const { slug } = params;

    console.log(`[API] Fetching page for slug: ${slug}`);

    const row = await prisma.seoPage.findUnique({ where: { slug } });

    if (!row) {
      // 1. If requesting Terms, seed default data
      if (slug === "terms-of-service") {
        console.log("[API] Seeding default Terms of Service...");
        const created = await prisma.seoPage.create({
          data: { slug, data: SEO_PAGE_TERMS_TEMPLATE as any },
        });
        return NextResponse.json({ ok: true, data: created.data });
      }
      
      // 2. If requesting Privacy, seed default data
      if (slug === "privacy-policy") {
         console.log("[API] Seeding default Privacy Policy...");
         const created = await prisma.seoPage.create({
           data: { slug, data: SEO_PAGE_PRIVACY_TEMPLATE as any },
         });
         return NextResponse.json({ ok: true, data: created.data });
      }

      // 3. If requesting Contact, seed default data
      if (slug === "contact") {
         console.log("[API] Seeding default Contact Page...");
         const created = await prisma.seoPage.create({
           data: { slug, data: SEO_PAGE_CONTACT_TEMPLATE as any },
         });
         return NextResponse.json({ ok: true, data: created.data });
      }

      // 4. Otherwise, return 404
      return NextResponse.json({ ok: false, error: "Page not found" }, { status: 404 });
    }

    return NextResponse.json({ ok: true, data: row.data });
  } catch (error) {
    console.error("[API Error] GET /seo/pages/[slug]:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}

export async function POST(req: Request, props: Props) {
  try {
    const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
    if (!g.ok) return g.response;

    // ✅ Fix: Await the params object
    const params = await props.params;
    const { slug } = params;
    
    const text = await req.text();
    let body: any;
    try {
      body = JSON.parse(text);
    } catch {
      return NextResponse.json({ ok: false, error: "Invalid JSON" }, { status: 400 });
    }

    const data = body?.data;
    if (!data) return NextResponse.json({ ok: false, error: "Missing data" }, { status: 400 });

    const saved = await prisma.seoPage.upsert({
      where: { slug },
      create: { slug, data },
      update: { data },
    });

    return NextResponse.json({ ok: true, data: saved.data });
  } catch (error) {
    console.error("[API Error] POST /seo/pages/[slug]:", error);
    return NextResponse.json({ ok: false, error: "Internal Server Error" }, { status: 500 });
  }
}