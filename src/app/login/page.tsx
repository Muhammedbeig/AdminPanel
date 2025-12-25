"use client";

import { useEffect, useMemo, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export default function LoginPage() {
  const router = useRouter();
  const params = useSearchParams();
  const nextUrl = useMemo(() => params.get("next") || "/", [params]);

  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";
  const { user, loading, signInEmail } = useAdminAuth();

  const [email, setEmail] = useState("adminb@livesoccerr.com");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  useEffect(() => {
    if (!loading && user) router.replace(nextUrl);
  }, [loading, user, router, nextUrl]);

  useEffect(() => {
    if (BYPASS) router.replace(nextUrl);
  }, [BYPASS, router, nextUrl]);

  const onEmailLogin = async () => {
    setErr(null);
    setBusy(true);
    try {
      await signInEmail(email, password);
      router.replace(nextUrl);
    } catch (e: any) {
      setErr(e?.message || "Login failed");
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-140px)] flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">
        <div className="theme-bg theme-border border rounded-2xl p-6 shadow-sm">
          <div className="text-xl font-black text-primary">Admin Login</div>
          <div className="text-sm text-secondary mt-1">
            Sign in to manage <span className="font-semibold text-primary">LiveSocceRR</span>.
          </div>

          {err ? (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 px-3 py-2 text-sm text-red-700 dark:text-red-300">
              {err}
            </div>
          ) : null}

          <div className="mt-6 space-y-3">
            <div>
              <label className="text-xs font-bold text-secondary">Email</label>
              <input
                className="mt-1 w-full theme-border border rounded-xl px-3 py-2 theme-bg text-primary outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="adminb@livesoccerr.com"
                autoComplete="email"
              />
            </div>

            <div>
              <label className="text-xs font-bold text-secondary">Password</label>
              <input
                className="mt-1 w-full theme-border border rounded-xl px-3 py-2 theme-bg text-primary outline-none focus:ring-2 focus:ring-black/5 dark:focus:ring-white/10"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
              />
            </div>

            <button
              type="button"
              disabled={busy}
              onClick={onEmailLogin}
              className="w-full rounded-xl px-4 py-2 font-bold bg-[#0f80da] text-white disabled:opacity-60"
            >
              {busy ? "Signing in..." : "Sign in"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
