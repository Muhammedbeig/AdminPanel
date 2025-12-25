import "./globals.css";
import React from "react";
import { ThemeProvider } from "@/components/providers/ThemeProvider";
import AdminClientLayout from "@/components/admin/AdminClientLayout";

export const metadata = {
  title: "LiveSocceRR Admin",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider>
          <AdminClientLayout>{children}</AdminClientLayout>
        </ThemeProvider>
      </body>
    </html>
  );
}
