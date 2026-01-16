"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

// ✅ UPDATED: Roles matching your prisma schema
export type AdminRole = "ADMIN" | "EDITOR" | "SEO_MANAGER" | "CONTENT_WRITER" | "DEVELOPER";

export type AdminUser = {
  id: number;
  email: string;
  role: AdminRole;
};

// ... (Keep the rest of the file EXACTLY as it was, just change the AdminRole type above) ...
type Ctx = {
  user: AdminUser | null;
  loading: boolean;
  role: AdminRole | null;
  roleLoading: boolean;
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;
  logout: () => Promise<void>;
  refreshClaims: () => Promise<void>;
  refresh: () => Promise<void>;
};

const AdminAuthContext = createContext<Ctx | null>(null);

async function readJsonSafe(res: Response) {
  const text = await res.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export function AdminAuthProvider({ children }: { children: React.ReactNode }) {
  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const [user, setUser] = useState<AdminUser | null>(null);
  const [loading, setLoading] = useState(true);

  async function refresh() {
    if (BYPASS) {
      // ✅ Updated mock role for bypass
      setUser({ id: 1, email: "bypass@local", role: "DEVELOPER" });
      setLoading(false);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/me", { method: "GET", cache: "no-store" });
      const j = await readJsonSafe(res);

      if (res.ok && j?.ok && j?.user) {
        setUser(j.user as AdminUser);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function signInEmail(email: string, password: string) {
    if (BYPASS) {
      setUser({ id: 1, email, role: "DEVELOPER" });
      return { ok: true };
    }

    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ email, password }),
      });

      const j = await readJsonSafe(res);

      if (!res.ok || !j?.ok) {
        return { ok: false, error: j?.error || "Login failed" };
      }

      await refresh();
      return { ok: true };
    } catch (e: any) {
      return { ok: false, error: e?.message || "Login failed" };
    }
  }

  async function logout() {
    if (BYPASS) {
      setUser(null);
      return;
    }

    try {
      await fetch("/api/auth/logout", { method: "POST" });
    } finally {
      setUser(null);
    }
  }

  async function refreshClaims() { return; }

  const value: Ctx = useMemo(() => {
    const role = user?.role ?? null;
    return {
      user,
      loading,
      role,
      roleLoading: loading,
      signInEmail,
      logout,
      refreshClaims,
      refresh,
    };
  }, [user, loading]);

  return <AdminAuthContext.Provider value={value}>{children}</AdminAuthContext.Provider>;
}

export function useAdminAuth() {
  const ctx = useContext(AdminAuthContext);
  if (!ctx) throw new Error("useAdminAuth must be used within AdminAuthProvider");
  return ctx;
}