"use client";

import React, { useEffect } from "react";
import { usePathname, useRouter } from "next/navigation";
import { Skeleton } from "@/components/ui/Skeleton";
import { useAdminAuth } from "./AdminAuthProvider";

function normalizePath(p: string) {
  const x = (p || "").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

export default function AdminAuthGate({ children }: { children: React.ReactNode }) {
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  if (BYPASS) return <>{children}</>;

  const { user, loading } = useAdminAuth();

  const pathnameRaw = usePathname();
  const pathname = normalizePath(pathnameRaw);

  const router = useRouter();

  const isAuthPage = pathname === "/login" || pathname === "/admin/login";
  const loginPath = pathname.startsWith("/admin") ? "/admin/login" : "/login";

  useEffect(() => {
    if (isAuthPage) return;
    if (loading) return;
    if (user) return;

    // ✅ No useSearchParams() (avoids build-time Suspense requirement)
    const url = new URL(window.location.href);
    url.searchParams.delete("next");
    const qs = url.searchParams.toString();

    const current = `${pathname}${qs ? `?${qs}` : ""}`;
    router.replace(`${loginPath}?next=${encodeURIComponent(current)}`);
  }, [isAuthPage, loading, user, pathname, router, loginPath]);

  if (isAuthPage) return <>{children}</>;

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto w-full px-4 py-6">
        <div className="theme-bg border theme-border rounded-xl p-6 space-y-4">
          <Skeleton className="h-7 w-52" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-10 w-40" />
        </div>
      </div>
    );
  }

  if (!user) return null;
  return <>{children}</>;
}
