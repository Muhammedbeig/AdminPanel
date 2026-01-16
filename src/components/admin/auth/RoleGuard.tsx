"use client";

import React, { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type RoleGuardProps = {
  children: React.ReactNode;
  allowedRoles: string[];
};

export default function RoleGuard({ children, allowedRoles }: RoleGuardProps) {
  const { user, loading } = useAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (loading) return;

    // If no user, or user's role is NOT in the allowed list
    if (!user || !allowedRoles.includes(user.role)) {
      // Redirect to dashboard (or you could show a 403 page)
      router.replace("/");
    }
  }, [user, loading, allowedRoles, router]);

  if (loading) {
    return <div className="p-8 text-center text-sm text-secondary">Checking permissions...</div>;
  }

  // If unauthorized, render nothing while redirecting
  if (!user || !allowedRoles.includes(user.role)) {
    return null;
  }

  return <>{children}</>;
}