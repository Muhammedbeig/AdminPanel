import { prisma } from "@/lib/db/prisma";
import DashboardClient from "@/components/admin/dashboard/DashboardClient";

// ✅ Add Title
export const metadata = {
  title: "Dashboard",
};

// Force dynamic so counts update on every refresh
export const dynamic = "force-dynamic";

export default async function AdminDashboard() {
  // 1. Fetch Real Counts in Parallel
  const [
    userCount,
    leagueCount,
    matchCount,
    playerCount,
    pageCount,
    recentUsers
  ] = await Promise.all([
    prisma.user.count(),
    prisma.seoLeague.count(),
    prisma.seoMatch.count(),
    prisma.seoPlayer.count(),
    prisma.seoPage.count(),
    // Fetch last 5 members for the "Recent Activity" table
    prisma.user.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      select: { id: true, email: true, role: true, createdAt: true },
    }),
  ]);

  const stats = {
    users: userCount,
    leagues: leagueCount,
    matches: matchCount,
    players: playerCount,
    pages: pageCount,
  };

  return <DashboardClient stats={stats} recentUsers={recentUsers} />;
}