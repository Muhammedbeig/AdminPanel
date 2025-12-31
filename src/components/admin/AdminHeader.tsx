"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Home } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";
import AdminUserMenu from "@/components/admin/AdminUserMenu";

export default function AdminHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // Light: blue header like reference
  // Dark: themed header
  const headerClass = isDark ? "theme-bg theme-border border-b" : "bg-[#0f80da] border-none";

  const logoPillClass = isDark ? "bg-[#0f80da] text-white" : "bg-white text-[#0f80da]";
  const titleClass = isDark ? "text-primary" : "text-white";
  const subClass = isDark ? "text-secondary" : "text-white/80";

  const iconBtnClass = isDark
    ? "text-secondary hover:bg-slate-800"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  // ✅ New State for Dynamic Branding
  // We initialize with defaults to prevent layout shifts
  const [config, setConfig] = useState({ 
    siteName: "LiveSocceRR Admin", 
    logo: "" 
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  // ✅ Fetch from the NEW Settings API
  useEffect(() => {
    fetch("/api/admin/settings")
      .then((res) => res.json())
      .then((j) => {
        if (j.ok && j.settings) {
          setConfig({
            siteName: j.settings.siteName || "LiveSocceRR Admin",
            logo: j.settings.logo || "", // Note: API returns 'logo', not 'logoUrl'
          });
        }
      })
      .catch((err) => console.error("Header config load failed", err))
      .finally(() => setLoadingConfig(false));
  }, []);

  return (
    <header className={`${headerClass} h-16 sticky top-0 z-40 shadow-sm transition-colors duration-200`}>
      <div className="mx-auto max-w-7xl h-full px-4 flex items-center gap-3">
        {/* Mobile menu button */}
        <button
          type="button"
          onClick={onOpenSidebar}
          className={`lg:hidden p-2.5 rounded-full transition-colors ${iconBtnClass}`}
          aria-label="Open menu"
        >
          <Menu size={22} />
        </button>

        {/* Brand */}
        <Link href="/" className="flex items-center gap-3 whitespace-nowrap">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden ${logoPillClass}`}>
            {/* ✅ Dynamic Logo Logic */}
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img
                src={config.logo}
                alt="Logo"
                className="w-full h-full object-contain p-1"
              />
            ) : (
              // Fallback Icon
              <Home size={18} />
            )}
          </div>

          <div className="min-w-0">
            {/* ✅ Dynamic Site Name */}
            <div className={`text-xl md:text-2xl font-bold tracking-tight leading-none ${titleClass}`}>
               {loadingConfig ? "Loading..." : config.siteName}
            </div>
            <div className={`text-[11px] font-medium leading-4 ${subClass}`}>Control Panel</div>
          </div>
        </Link>

        {/* Right actions */}
        <div className="ml-auto flex items-center gap-1">
          <AdminThemeToggle />
          <AdminUserMenu />
        </div>
      </div>
    </header>
  );
}