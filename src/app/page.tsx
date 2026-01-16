import { prisma } from "@/lib/db/prisma";
import DashboardClient from "@/components/admin/dashboard/DashboardClient";

export const metadata = {
  title: "Dashboard",
};

export const dynamic = "force-dynamic";

const DASHBOARD_TIMEOUT_MS = Math.max(500, Number(process.env.ADMIN_DASHBOARD_TIMEOUT_MS || "3000"));

async function withTimeout<T>(p: Promise<T>, ms: number): Promise<T | null> {
  let timeoutId: ReturnType<typeof setTimeout> | null = null;
  const timeout = new Promise<null>((resolve) => {
    timeoutId = setTimeout(() => resolve(null), ms);
  });

  const safe = p.then((v) => v).catch(() => null);
  const result = (await Promise.race([safe, timeout])) as T | null;

  if (timeoutId) clearTimeout(timeoutId);
  return result;
}

export default async function AdminDashboard() {
  const results = await withTimeout(
    Promise.all([
      prisma.user.count(),
      prisma.seoLeague.count(),
      prisma.seoMatch.count(),
      prisma.seoPlayer.count(),
      prisma.seoPage.count(),
      prisma.user.findMany({
        take: 5,
        orderBy: { createdAt: "desc" },
        select: { id: true, email: true, role: true, createdAt: true },
      }),
    ]),
    DASHBOARD_TIMEOUT_MS
  );

  const stats = {
    users: results ? Number(results[0] || 0) : 0,
    leagues: results ? Number(results[1] || 0) : 0,
    matches: results ? Number(results[2] || 0) : 0,
    players: results ? Number(results[3] || 0) : 0,
    pages: results ? Number(results[4] || 0) : 0,
  };

  const recentUsers = results ? (results[5] as any[]) : [];

  return <DashboardClient stats={stats} recentUsers={recentUsers} />;
}
