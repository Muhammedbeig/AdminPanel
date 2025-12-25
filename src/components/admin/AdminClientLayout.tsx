"use client";

import React from "react";
import { usePathname } from "next/navigation";
import { AdminAuthProvider } from "@/components/admin/auth/AdminAuthProvider";
import AdminAuthGate from "@/components/admin/auth/AdminAuthGate";
import AdminShell from "@/components/admin/AdminShell";

export default function AdminClientLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLogin = pathname === "/login" || pathname === "/admin/login";

  return (
    <AdminAuthProvider>
      <AdminAuthGate>{isLogin ? children : <AdminShell>{children}</AdminShell>}</AdminAuthGate>
    </AdminAuthProvider>
  );
}
