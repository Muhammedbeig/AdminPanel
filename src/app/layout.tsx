import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AdminClientLayout from "@/components/admin/AdminClientLayout";
import { Metadata } from "next";
import { unstable_noStore as noStore } from "next/cache";
import { prisma } from "@/lib/db/prisma";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  noStore();

  let siteName = process.env.NEXT_PUBLIC_ADMIN_SITE_NAME || "Admin Panel";
  let favicon = "/favicon.ico";

  try {
    const row = await prisma.systemSetting.findFirst({
      select: { siteName: true, favicon: true },
    });
    if (row?.siteName) siteName = String(row.siteName);
    if (row?.favicon) favicon = String(row.favicon);
  } catch {
    // fallback to env/defaults
  }

  return {
    title: {
      template: `%s || ${siteName}`,
      default: siteName,
    },
    description: "Admin Control Panel",
    icons: {
      icon: favicon || "/favicon.ico",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <AdminClientLayout>{children}</AdminClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
