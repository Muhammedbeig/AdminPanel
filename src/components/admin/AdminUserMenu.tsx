"use client";

import React, { useMemo, useState } from "react";
import { ChevronDown, LogOut, User2 } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export default function AdminUserMenu() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { user, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);

  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const email = useMemo(() => {
    if (BYPASS) return "adminb@livesoccerr.com";
    return user?.email || "unknown";
  }, [user, BYPASS]);

  // ✅ Match reference button style on header (no borders on blue header)
  const btnClass = isDark
    ? "text-secondary hover:bg-slate-800"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  return (
    <div className="relative">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className={`flex items-center gap-2 p-2.5 rounded-full transition-colors ${btnClass}`}
        aria-label="User menu"
      >
        <User2 size={20} />
        <span className="hidden sm:inline text-sm font-bold max-w-[180px] truncate">
          {email}
        </span>
        {BYPASS ? <span className="text-[10px] font-black tracking-widest opacity-80">DEV</span> : null}
        <ChevronDown size={18} className={isDark ? "text-secondary" : "text-white/70"} />
      </button>

      {open ? (
        <>
          <div className="absolute right-0 mt-2 w-64 theme-bg theme-border border rounded-2xl shadow-2xl overflow-hidden z-40">
            <div className="px-4 py-3">
              <div className="text-[11px] font-black text-secondary uppercase tracking-widest">
                Signed in as
              </div>
              <div className="text-sm font-black text-primary truncate mt-1">{email}</div>
            </div>

            <div className="theme-border border-t" />

            <button
              type="button"
              className={`w-full flex items-center gap-2 px-4 py-3 text-sm font-black ${
                isDark ? "text-secondary hover:bg-slate-800 hover:text-slate-200" : "text-secondary hover:bg-slate-50 hover:text-primary"
              }`}
              onClick={async () => {
                setOpen(false);
                await logout();
              }}
              disabled={BYPASS}
              title={BYPASS ? "Dev bypass enabled" : "Sign out"}
            >
              <LogOut size={16} />
              Sign out
            </button>
          </div>

          <button
            className="fixed inset-0 z-30 cursor-default"
            onClick={() => setOpen(false)}
            aria-label="Close user menu"
          />
        </>
      ) : null}
    </div>
  );
}
