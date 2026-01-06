import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AdminClientLayout from "@/components/admin/AdminClientLayout";
import { prisma } from "@/lib/db/prisma"; 
import { Metadata } from "next";

export async function generateMetadata(): Promise<Metadata> {
  // ✅ FIX: Fetch from 'systemSetting' where siteName actually lives
  const settings = await prisma.systemSetting.findFirst();

  // If settings exist, use the siteName. Otherwise, fallback to "Admin Panel"
  const siteName = settings?.siteName || "Admin Panel";

  return {
    title: {
      template: `%s || ${siteName}`, 
      default: siteName, 
    },
    description: "Admin Control Panel",
    icons: {
      icon: "/favicon.ico",
    },
  };
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ThemeProvider>
          <AdminClientLayout>{children}</AdminClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}