// app/admin/src/app/api/seo/pages/[slug]/route.ts
import { NextResponse } from "next/server";
import path from "node:path";
import { promises as fs } from "node:fs";

import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

import SEO_PAGE_TERMS_TEMPLATE from "@/livesoccerr/templates/seo-page.terms-of-service";
import SEO_PAGE_PRIVACY_TEMPLATE from "@/livesoccerr/templates/seo-page.privacy-policy";
import SEO_PAGE_CONTACT_TEMPLATE from "@/livesoccerr/templates/seo-page.contact";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

type AllowedSlug = "terms-of-service" | "privacy-policy" | "contact";
const ALLOWED = new Set<AllowedSlug>(["terms-of-service", "privacy-policy", "contact"]);

function normalizeSlug(s: string) {
  return String(s || "").trim().replace(/^\/+/, "").replace(/\/+$/, "");
}

/** -------------------- SAFE TYPE GUARDS (fix TS error) -------------------- */
function isRecord(v: unknown): v is Record<string, unknown> {
  return !!v && typeof v === "object" && !Array.isArray(v);
}

function hasContent(v: unknown): v is Record<string, unknown> & { content: unknown } {
  return isRecord(v) && "content" in v;
}
/** ------------------------------------------------------------------------ */

function candidateStoreDirs(): string[] {
  const envDir = (process.env.SEO_STORE_DIR || "").trim();
  const cwd = process.cwd();
  const dirs = [
    envDir,
    path.resolve(cwd, "seo-config"),
    path.resolve(cwd, "..", "seo-config"),
    path.resolve(cwd, "../..", "seo-config"),
    path.resolve(cwd, "../../..", "seo-config"),
    path.resolve(cwd, "../../../..", "seo-config"),
  ].filter(Boolean);

  return Array.from(new Set(dirs));
}

async function fileExists(p: string) {
  try {
    const st = await fs.stat(p);
    return st.isFile();
  } catch {
    return false;
  }
}

async function ensureDir(dir: string) {
  await fs.mkdir(dir, { recursive: true });
}

function filenameFor(slug: AllowedSlug) {
  return `seo-page.${slug}.json`;
}

async function findExistingFilePath(slug: AllowedSlug): Promise<string | null> {
  const name = filenameFor(slug);
  for (const dir of candidateStoreDirs()) {
    const full = path.join(dir, name);
    if (await fileExists(full)) return full;
  }
  return null;
}

function defaultFilePath(slug: AllowedSlug) {
  const envDir = (process.env.SEO_STORE_DIR || "").trim();
  if (envDir) return path.join(envDir, filenameFor(slug));

  const dirs = candidateStoreDirs();
  const bestDir = dirs[dirs.length - 1] || path.resolve(process.cwd(), "seo-config");
  return path.join(bestDir, filenameFor(slug));
}

async function readJson(filepath: string) {
  try {
    const raw = await fs.readFile(filepath, "utf8");
    return JSON.parse(raw) as unknown;
  } catch {
    return null;
  }
}

async function atomicWriteJson(filepath: string, data: any) {
  const dir = path.dirname(filepath);
  await ensureDir(dir);
  const tmp = `${filepath}.tmp`;
  await fs.writeFile(tmp, JSON.stringify(data, null, 2), "utf8");
  await fs.rename(tmp, filepath);
}

function seedTemplateFor(slug: AllowedSlug) {
  if (slug === "terms-of-service") return SEO_PAGE_TERMS_TEMPLATE as any;
  if (slug === "privacy-policy") return SEO_PAGE_PRIVACY_TEMPLATE as any;
  return SEO_PAGE_CONTACT_TEMPLATE as any;
}

/**
 * IMPORTANT:
 * - On GET: do NOT update updatedAt (prevents watcher loop)
 * - On POST: update updatedAt (real save)
 */
function ensureDoc(slug: AllowedSlug, doc: unknown, touchUpdatedAt: boolean) {
  const obj: any = isRecord(doc) ? { ...(doc as any) } : { content: doc };
  if (!obj.slug) obj.slug = slug;
  if (obj.schemaVersion == null) obj.schemaVersion = 1;
  if (touchUpdatedAt || !obj.updatedAt) obj.updatedAt = new Date().toISOString();
  return obj;
}

function sectionCount(doc: any): number {
  const secs = doc?.content?.sections;
  return Array.isArray(secs) ? secs.length : 0;
}

function noCacheJson(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

export async function GET(_req: Request, props: Props) {
  try {
    const { slug: raw } = await props.params;
    const slug = normalizeSlug(raw) as AllowedSlug;
    if (!ALLOWED.has(slug)) return noCacheJson({ ok: false, error: "Invalid slug" }, 400);

    // Read file (if exists)
    const existingFilePath = await findExistingFilePath(slug);
    const filePath = existingFilePath || defaultFilePath(slug);
    const fileJsonRaw = existingFilePath ? await readJson(existingFilePath) : null;
    const fileJson = hasContent(fileJsonRaw) ? ensureDoc(slug, fileJsonRaw, false) : null;

    // Read DB (✅ fix: no .content access without guard)
    const row = await prisma.seoPage.findUnique({ where: { slug } });
    const dbJson = hasContent(row?.data) ? ensureDoc(slug, row?.data as unknown, false) : null;

    const templateJson = ensureDoc(slug, seedTemplateFor(slug), false);

    // 1) If DB missing → seed from file if file has content else from template
    if (!row) {
      const seed = fileJson?.content ? fileJson : templateJson;
      const created = await prisma.seoPage.create({ data: { slug, data: seed } });

      // If file did not exist, write once (NO updatedAt touch on GET)
      if (!existingFilePath) {
        try {
          await atomicWriteJson(filePath, seed);
        } catch (e) {
          console.error(`[seo/pages] seed file write failed for ${slug}:`, e);
        }
      }

      return noCacheJson({ ok: true, data: created.data });
    }

    // 2) If Terms/Privacy exists but is intro-only → upgrade DB from best source (file or template)
    if ((slug === "terms-of-service" || slug === "privacy-policy") && dbJson) {
      const dbSecs = sectionCount(dbJson);
      const fileSecs = fileJson ? sectionCount(fileJson) : 0;
      const tplSecs = sectionCount(templateJson);

      if (dbSecs <= 1 && Math.max(fileSecs, tplSecs) >= 2) {
        const bestUpgrade = fileJson && fileSecs >= tplSecs ? fileJson : templateJson;

        // touch updatedAt ONCE because we are upgrading data
        const upgraded = ensureDoc(slug, bestUpgrade, true);

        const saved = await prisma.seoPage.update({
          where: { slug },
          data: { data: upgraded },
        });

        // If file missing, write once
        if (!existingFilePath) {
          try {
            await atomicWriteJson(filePath, upgraded);
          } catch (e) {
            console.error(`[seo/pages] upgrade seed file write failed for ${slug}:`, e);
          }
        }

        return noCacheJson({ ok: true, data: saved.data });
      }
    }

    // 3) Return DB as source of truth; if file missing, write once (no updatedAt touch)
    if (!existingFilePath && dbJson) {
      try {
        await atomicWriteJson(filePath, dbJson);
      } catch (e) {
        console.error(`[seo/pages] db->file initial write failed for ${slug}:`, e);
      }
    }

    return noCacheJson({ ok: true, data: ensureDoc(slug, row.data as unknown, false) });
  } catch (error) {
    console.error("[API Error] GET /seo/pages/[slug]:", error);
    return noCacheJson({ ok: false, error: "Internal Server Error" }, 500);
  }
}

export async function POST(req: Request, props: Props) {
  try {
    const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER]);
    if ("response" in g) return g.response;

    const { slug: raw } = await props.params;
    const slug = normalizeSlug(raw) as AllowedSlug;
    if (!ALLOWED.has(slug)) return noCacheJson({ ok: false, error: "Invalid slug" }, 400);

    const body = await req.json().catch(() => null);
    const incoming = body?.data;

    if (!incoming || typeof incoming !== "object") {
      return noCacheJson({ ok: false, error: "Missing `data` object" }, 400);
    }

    // ✅ On save, touch updatedAt
    const payload = ensureDoc(slug, incoming, true);

    // Save DB
    const saved = await prisma.seoPage.upsert({
      where: { slug },
      create: { slug, data: payload },
      update: { data: payload },
    });

    // Sync file (website reads this) — OK on POST
    const existingFilePath = await findExistingFilePath(slug);
    const filePath = existingFilePath || defaultFilePath(slug);
    try {
      await atomicWriteJson(filePath, saved.data);
    } catch (e) {
      console.error(`[seo/pages] POST file write failed for ${slug}:`, e);
    }

    return noCacheJson({ ok: true, data: saved.data });
  } catch (error) {
    console.error("[API Error] POST /seo/pages/[slug]:", error);
    return noCacheJson({ ok: false, error: "Internal Server Error" }, 500);
  }
}
