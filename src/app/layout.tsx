import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AdminClientLayout from "@/components/admin/AdminClientLayout";
import { ADMIN_SITE_NAME } from "@/config/admin-meta"; // ✅ Import Single Source of Truth

// ✅ GLOBAL METADATA CONFIGURATION
export const metadata = {
  title: {
    // %s is automatically replaced by the specific page's title
    template: `%s || ${ADMIN_SITE_NAME}`, 
    default: ADMIN_SITE_NAME, // Used if a page doesn't define a specific title
  },
  description: "Admin Control Panel for LiveSocceRR",
  icons: {
    icon: "/favicon.ico", // Optional: Add your favicon path here
  },
};

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