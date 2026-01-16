import { NextResponse } from "next/server";
import { prisma } from "@/lib/db/prisma";
import { requireRole } from "@/lib/auth/guard";
import { Role } from "@prisma/client";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

type EnvVar = { key: string; value: string };
type SystemEnvItem = {
  key: string;
  isSet: boolean;
  displayValue: string;
  source: "env";
  masked: boolean;
  overriddenByCustom?: boolean;
  activeSource?: "env" | "db";
  activeValue?: string; // only included when NOT masked
};

const BASE_SYSTEM_KEYS: string[] = [
  "ADMIN_BOOTSTRAP_SECRET",
  "ADMIN_SESSION_SECRET",
  "ADMIN_ENV_TOKEN",
  "DATABASE_URL",
  "SUPER_ADMIN_EMAIL",
  "NEXT_PUBLIC_MAINSITE_URL",
  "NEXT_PUBLIC_SITE_URL",
  "NEXT_PUBLIC_ADMIN_API_BASE",
  "ADMIN_API_BASE",
  "NEXT_PUBLIC_API_SPORTS_KEY",
  "API_SPORTS_KEY",
  "NEXT_PUBLIC_WIDGET_SCRIPT_URL",
  "NEXT_PUBLIC_WIDGET_LANG",
  "NEXT_PUBLIC_WIDGET_FAVORITES",
  "NEXT_PUBLIC_WIDGET_SHOW_ERRORS",
  "NEXT_PUBLIC_WIDGET_SHOW_LOGOS",
  "NEXT_PUBLIC_GA_ID",
  "GOOGLE_ANALYTICS_ID",
];

function isInterestingEnvKey(key: string) {
  const k = String(key || "").toUpperCase();
  if (!k) return false;
  if (k.startsWith("NEXT_PUBLIC_")) return true;
  if (/(API|KEY|TOKEN|SECRET|CLIENT|WEBHOOK|ANALYTICS|SENTRY|FIREBASE|GOOGLE|FACEBOOK)/i.test(k)) {
    return true;
  }
  return false;
}

function shouldMaskKey(key: string) {
  const k = String(key || "").toUpperCase();
  return (
    k.includes("SECRET") ||
    k.includes("TOKEN") ||
    k.includes("PASSWORD") ||
    k.includes("DATABASE_URL") ||
    k.endsWith("_KEY")
  );
}

function maskValue(v: string) {
  const s = String(v || "");
  if (!s) return "";
  if (s.length <= 6) return "••••";
  return `••••••••••••${s.slice(-4)}`;
}

function normalizeKey(raw: string) {
  return String(raw || "")
    .trim()
    .toUpperCase()
    .replace(/\s+/g, "_")
    .replace(/[^A-Z0-9_]/g, "_")
    .replace(/_+/g, "_");
}

// sanitize env vars from request OR DB
function sanitizeEnvVars(input: any): EnvVar[] {
  const arr = Array.isArray(input) ? input : [];
  const map = new Map<string, string>();

  for (const item of arr) {
    const key = normalizeKey(item?.key || "");
    const value = String(item?.value ?? "").trim();

    if (!key) continue;
    if (!/^[A-Z][A-Z0-9_]{1,120}$/.test(key)) continue;
    if (!value) continue;

    // IMPORTANT: block masked placeholders (••••1234) from ever being stored
    if (value.includes("•")) continue;

    map.set(key, value);
  }

  return Array.from(map.entries()).map(([key, value]) => ({ key, value }));
}

function noCacheJson(payload: any, status = 200) {
  const res = NextResponse.json(payload, { status });
  res.headers.set("Cache-Control", "no-store, no-cache, must-revalidate, proxy-revalidate");
  res.headers.set("Pragma", "no-cache");
  res.headers.set("Expires", "0");
  return res;
}

function computeSystemEnv(keys: string[], customMap: Record<string, string>): SystemEnvItem[] {
  return keys.map((key) => {
    const envVal = String(process.env[key] ?? "");
    const dbVal = String(customMap[key] ?? "");

    const masked = shouldMaskKey(key);

    // which value is “active” according to your override policy (DB overrides env)
    const activeValue = dbVal || envVal || "";
    const activeSource: "env" | "db" = dbVal ? "db" : "env";

    const isSet = Boolean(activeValue);
    const displayValue = isSet ? (masked ? maskValue(activeValue) : activeValue) : "";

    return {
      key,
      isSet,
      displayValue: isSet ? displayValue || "Set" : "",
      source: "env",
      masked,
      overriddenByCustom: Boolean(dbVal),
      activeSource,
      // only expose real value if not masked (safe for UI prefill)
      activeValue: masked ? undefined : activeValue,
    };
  });
}

function buildSystemKeys() {
  const fromEnv = Object.keys(process.env || {}).filter(isInterestingEnvKey);
  const all = new Set<string>([...BASE_SYSTEM_KEYS, ...fromEnv]);
  return Array.from(all).sort((a, b) => a.localeCompare(b));
}

export async function GET() {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  const row = await prisma.systemSetting.findFirst();

  const cleanCustom = sanitizeEnvVars((row as any)?.envVariables);
  const customMap = Object.fromEntries(cleanCustom.map((v) => [v.key, v.value]));

  const systemEnv = computeSystemEnv(buildSystemKeys(), customMap);

  const settings = row ? { ...(row as any), envVariables: cleanCustom } : { envVariables: cleanCustom };

  return noCacheJson({ ok: true, settings, systemEnv });
}

export async function PUT(req: Request) {
  const g = await requireRole([Role.ADMIN, Role.EDITOR, Role.SEO_MANAGER, Role.DEVELOPER]);
  if ("response" in g) return g.response;

  const body = await req.json().catch(() => null);
  if (!body || typeof body !== "object") {
    return noCacheJson({ ok: false, error: "Invalid payload" }, 400);
  }

  const cleanCustom = sanitizeEnvVars(body.envVariables);

  const dataToSave: any = {
    logo: String(body.logo || ""),
    favicon: String(body.favicon || ""),
    siteName: String(body.siteName || ""),
    supportEmail: String(body.supportEmail || ""),
    contactNumber: String(body.contactNumber || ""),
    address: String(body.address || ""),
    defaultLanguage: String(body.defaultLanguage || "en"),
    timezone: String(body.timezone || "UTC"),
    maintenanceMode: Boolean(body.maintenanceMode),
    googleAnalyticsId: String(body.googleAnalyticsId || ""),
    envVariables: cleanCustom,
  };

  const existing = await prisma.systemSetting.findFirst();

  const saved = existing
    ? await prisma.systemSetting.update({ where: { id: existing.id }, data: dataToSave })
    : await prisma.systemSetting.create({ data: dataToSave });

  return noCacheJson({ ok: true, settings: { ...(saved as any), envVariables: cleanCustom } });
}
