// app/admin/src/app/api/admin/web-settings/route.ts
import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";
import { revalidatePath } from "next/cache";

import SEO_STORE_GLOBAL_TEMPLATE from "@/livesoccerr/templates/seo-store.global";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// MUST match seo-store keys
const KEY = process.env.SEO_DB_KEY_GLOBAL ?? "livesoccerr";

function noCacheJson(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function toStringOrEmpty(v: any) {
  return typeof v === "string" ? v : "";
}

function toBoolOr(v: any, fallback: boolean) {
  return typeof v === "boolean" ? v : fallback;
}

function getNested(obj: any, path: string) {
  return path.split(".").reduce((acc, k) => (acc && typeof acc === "object" ? acc[k] : undefined), obj);
}

function ensureObj(root: any, key: string) {
  if (!root[key] || typeof root[key] !== "object") root[key] = {};
  return root[key];
}

function mapStoreToWebSettings(store: any) {
  const themeColor =
    toStringOrEmpty(getNested(store, "brand.themeColor")) || "#0f80da";

  const headerLogo =
    toStringOrEmpty(getNested(store, "brand.logoUrl")) || "";

  const favicon =
    toStringOrEmpty(getNested(store, "brand.faviconUrl")) || "";

  const footerLogo =
    toStringOrEmpty(getNested(store, "footer.logoUrl")) || "";

  const footerDescription =
    toStringOrEmpty(getNested(store, "footer.aboutText")) || "";

  const socials = (getNested(store, "footer.socials") || {}) as Record<string, any>;

  const placeholderImage =
    toStringOrEmpty(getNested(store, "assets.placeholderImage")) ||
    toStringOrEmpty(getNested(store, "defaults.og.fallbackImage")) ||
    toStringOrEmpty(getNested(store, "brand.defaultOgImage")) ||
    "";

  const googleMapUrl =
    toStringOrEmpty(getNested(store, "web.googleMapUrl")) ||
    toStringOrEmpty(getNested(store, "web.googleMapEmbed")) ||
    "";

  const showLandingPage = toBoolOr(getNested(store, "web.showLandingPage"), true);

  const latitude = toStringOrEmpty(getNested(store, "web.location.latitude"));
  const longitude = toStringOrEmpty(getNested(store, "web.location.longitude"));

  return {
    themeColor,
    headerLogo,
    favicon,
    footerLogo,
    placeholderImage,
    footerDescription,
    googleMapUrl,
    showLandingPage,
    latitude,
    longitude,

    socialInstagram: toStringOrEmpty(socials.instagram),
    socialX: toStringOrEmpty(socials.twitter),
    socialFacebook: toStringOrEmpty(socials.facebook),
    socialLinkedin: toStringOrEmpty(socials.linkedin),
    socialPinterest: toStringOrEmpty(socials.pinterest),
  };
}

function applyWebSettingsToStore(store: any, body: any) {
  const next = store && typeof store === "object" ? JSON.parse(JSON.stringify(store)) : {};

  const brand = ensureObj(next, "brand");
  const footer = ensureObj(next, "footer");
  const assets = ensureObj(next, "assets");
  const web = ensureObj(next, "web");

  // brand
  if (typeof body.themeColor === "string") brand.themeColor = body.themeColor.trim();
  if (typeof body.headerLogo === "string") brand.logoUrl = body.headerLogo.trim();
  if (typeof body.favicon === "string") brand.faviconUrl = body.favicon.trim();

  // footer
  if (typeof body.footerLogo === "string") footer.logoUrl = body.footerLogo.trim();
  if (typeof body.footerDescription === "string") footer.aboutText = body.footerDescription;

  const socials = ensureObj(footer, "socials");
  if (typeof body.socialInstagram === "string") socials.instagram = body.socialInstagram.trim();
  if (typeof body.socialX === "string") socials.twitter = body.socialX.trim();
  if (typeof body.socialFacebook === "string") socials.facebook = body.socialFacebook.trim();
  if (typeof body.socialLinkedin === "string") socials.linkedin = body.socialLinkedin.trim();
  if (typeof body.socialPinterest === "string") socials.pinterest = body.socialPinterest.trim();

  // assets
  if (typeof body.placeholderImage === "string") assets.placeholderImage = body.placeholderImage.trim();

  // web extras (optional, but now stored in seoGlobal)
  if (typeof body.googleMapUrl === "string") {
    web.googleMapEmbed = body.googleMapUrl; // keep your old field name but store in global
  }
  if (typeof body.showLandingPage === "boolean") web.showLandingPage = body.showLandingPage;

  const location = ensureObj(web, "location");
  if (typeof body.latitude === "string") location.latitude = body.latitude.trim();
  if (typeof body.longitude === "string") location.longitude = body.longitude.trim();

  next.updatedAt = new Date().toISOString();
  next.schemaVersion = next.schemaVersion ?? 1;

  return next;
}

async function getOrSeedSeoGlobal() {
  const row = await prisma.seoGlobal.findUnique({ where: { key: KEY } });
  if (row?.data) return row.data as any;

  const seeded = SEO_STORE_GLOBAL_TEMPLATE as any;
  await prisma.seoGlobal.create({ data: { key: KEY, data: seeded } });
  return seeded;
}

export async function GET() {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  const store = await getOrSeedSeoGlobal();
  const settings = mapStoreToWebSettings(store);

  return noCacheJson({ ok: true, settings });
}

export async function PUT(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  let body: any = null;
  try {
    body = await req.json();
  } catch {
    return noCacheJson({ ok: false, error: "Invalid JSON body" }, 400);
  }

  const current = await getOrSeedSeoGlobal();
  const next = applyWebSettingsToStore(current, body);

  const saved = await prisma.seoGlobal.upsert({
    where: { key: KEY },
    create: { key: KEY, data: next },
    update: { data: next },
  });

  // Ensure favicon/theme/layout update immediately
  revalidatePath("/", "layout");

  // Return same shape your UI expects
  return noCacheJson({ ok: true, settings: mapStoreToWebSettings(saved.data as any) });
}
