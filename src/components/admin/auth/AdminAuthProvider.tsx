"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

export type AdminRole = "OWNER" | "ADMIN" | "EDITOR" | "SEO_MANAGER" | "VIEWER";

export type AdminUser = {
  id: number;
  email: string;
  role: AdminRole;
};

type Ctx = {
  user: AdminUser | null;
  loading: boolean;

  // kept for compatibility with pages using role/roleLoading
  role: AdminRole | null;
  roleLoading: boolean;

  // used by login page
  signInEmail: (email: string, password: string) => Promise<{ ok: boolean; error?: string }>;

  // used by user menu etc
  logout: () => Promise<void>;

  // used by some pages (old firebase flow) – keep as harmless no-op
  refreshClaims: () => Promise<void>;

  // handy manual refresh
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
      setUser({ id: 1, email: "bypass@local", role: "ADMIN" });
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
      setUser({ id: 1, email, role: "ADMIN" });
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

      // cookie is set server-side; now sync user
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

  async function refreshClaims() {
    // Firebase legacy compatibility (no-op in cookie auth)
    return;
  }

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
