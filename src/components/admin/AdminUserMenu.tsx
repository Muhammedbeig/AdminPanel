"use client";

import React, { useMemo, useState, useEffect } from "react";
import Link from "next/link";
import { ChevronDown, LogOut, User2, Settings, User } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export default function AdminUserMenu() {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  const { user, logout } = useAdminAuth();
  const [open, setOpen] = useState(false);
  
  // ✅ New: Local state to hold profile details (Name/Image) 
  // since they are not in the strict SessionUser type.
  const [profile, setProfile] = useState<{ name?: string; image?: string } | null>(null);

  const BYPASS = process.env.NEXT_PUBLIC_ADMIN_BYPASS_AUTH === "true";

  const email = useMemo(() => {
    if (BYPASS) return "adminb@livesoccerr.com";
    return user?.email || "unknown";
  }, [user, BYPASS]);

  // Fetch full profile details on mount
  useEffect(() => {
    if (!user) return;
    fetch("/api/admin/profile")
      .then((res) => res.json())
      .then((data) => {
        if (data.ok && data.user) {
          setProfile(data.user);
        }
      })
      .catch((err) => console.error("Failed to load menu profile:", err));
  }, [user]);

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
        {/* Avatar / Icon */}
        <div className="w-6 h-6 rounded-full bg-white/20 flex items-center justify-center overflow-hidden">
           {profile?.image ? (
             // eslint-disable-next-line @next/next/no-img-element
             <img src={profile.image} alt="User" className="w-full h-full object-cover" />
           ) : (
             <User2 size={16} />
           )}
        </div>
        <span className="hidden sm:inline text-sm font-bold max-w-[180px] truncate">
          {profile?.name || email}
        </span>
        <ChevronDown size={16} className={isDark ? "text-secondary" : "text-white/70"} />
      </button>

      {open && (
        <>
          <div className="fixed inset-0 z-30" onClick={() => setOpen(false)} />
          <div className="absolute right-0 top-full mt-2 w-64 theme-bg theme-border border rounded-xl shadow-2xl overflow-hidden z-40 animate-in fade-in zoom-in-95">
            
            {/* Header Info */}
            <div className="px-4 py-3 bg-slate-50 dark:bg-white/5 border-b theme-border">
              <div className="text-[10px] font-black text-secondary uppercase tracking-widest">
                Signed in as
              </div>
              <div className="text-sm font-bold text-primary truncate mt-0.5">{email}</div>
            </div>

            {/* Menu Items */}
            <div className="p-1">
                <Link 
                  href="/profile/password"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <Settings size={16} /> Change Password
                </Link>
                
                <Link 
                  href="/profile"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-3 py-2 text-sm font-medium text-secondary hover:text-primary hover:bg-slate-100 dark:hover:bg-white/10 rounded-lg transition-colors"
                >
                  <User size={16} /> Change Profile
                </Link>
            </div>

            <div className="theme-border border-t m-1" />

            {/* Logout */}
            <div className="p-1">
                <button
                  type="button"
                  className="w-full flex items-center gap-3 px-3 py-2 text-sm font-bold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-500/10 rounded-lg transition-colors"
                  onClick={async () => {
                    setOpen(false);
                    await logout();
                  }}
                >
                  <LogOut size={16} />
                  Sign out
                </button>
            </div>
          </div>
        </>
      )}
    </div>
  );
}