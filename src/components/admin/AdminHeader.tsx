"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Menu, Home } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import AdminThemeToggle from "@/components/admin/AdminThemeToggle";
import AdminUserMenu from "@/components/admin/AdminUserMenu";
import HeaderCommandSearch from "@/components/admin/HeaderCommandSearch";

export default function AdminHeader({ onOpenSidebar }: { onOpenSidebar: () => void }) {
  const { theme } = useTheme();
  const isDark = theme === "dark";

  // ✅ PRESERVED: Your exact design logic
  const headerClass = isDark ? "theme-bg theme-border border-b" : "bg-[#0f80da] border-none";
  const logoPillClass = isDark ? "bg-[#0f80da] text-white" : "bg-white text-[#0f80da]";
  const titleClass = isDark ? "text-primary" : "text-white";
  const subClass = isDark ? "text-secondary" : "text-white/80";
  const iconBtnClass = isDark
    ? "text-secondary hover:bg-slate-800"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  const [config, setConfig] = useState({ 
    siteName: "LiveSocceRR Admin", 
    logo: "" 
  });
  const [loadingConfig, setLoadingConfig] = useState(true);

  async function loadConfig() {
    try {
      const res = await fetch("/api/admin/settings", { cache: "no-store" });
      const j = await res.json();
      if (j.ok && j.settings) {
        setConfig({
          siteName: j.settings.siteName || "LiveSocceRR Admin",
          logo: j.settings.logo || "",
        });
      }
    } catch (err) {
      console.error("Header config error:", err);
    } finally {
      setLoadingConfig(false);
    }
  }

  useEffect(() => {
    loadConfig();

    const onSettingsUpdated = (event: Event) => {
      const e = event as CustomEvent;
      const settings = e?.detail?.settings;
      if (settings) {
        setConfig({
          siteName: settings.siteName || "LiveSocceRR Admin",
          logo: settings.logo || "",
        });
      } else {
        loadConfig();
      }
    };

    const onStorage = (e: StorageEvent) => {
      if (e.key === "admin-settings-updated") loadConfig();
    };

    window.addEventListener("admin-settings-updated", onSettingsUpdated as EventListener);
    window.addEventListener("storage", onStorage);

    return () => {
      window.removeEventListener("admin-settings-updated", onSettingsUpdated as EventListener);
      window.removeEventListener("storage", onStorage);
    };
  }, []);

  return (
    <header className={`${headerClass} h-16 sticky top-0 z-40 shadow-sm transition-colors duration-200`}>
      <div className="mx-auto max-w-7xl h-full px-4 flex items-center gap-3">
        
        {/* Brand (Now First) */}
        <Link href="/" className="flex items-center gap-3 whitespace-nowrap mr-4">
          <div className={`w-9 h-9 rounded-xl flex items-center justify-center shadow-sm shrink-0 overflow-hidden ${logoPillClass}`}>
            {config.logo ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={config.logo} alt="Logo" className="w-full h-full object-contain p-1" />
            ) : (
              <Home size={18} />
            )}
          </div>

          <div className="min-w-0 hidden md:block">
            <div className={`text-xl md:text-2xl font-bold tracking-tight leading-none ${titleClass}`}>
               {loadingConfig ? "Loading..." : config.siteName}
            </div>
            <div className={`text-[11px] font-medium leading-4 ${subClass}`}>Control Panel</div>
          </div>
        </Link>

        {/* Center Search */}
        <div className="flex-1 flex justify-end md:justify-center px-2">
           <HeaderCommandSearch />
        </div>

        {/* Right Actions */}
        <div className="ml-auto flex items-center gap-1">
          <AdminThemeToggle />
          <AdminUserMenu />

          {/* ✅ MOVED: Mobile Menu Button is now here */}
          <button
            type="button"
            onClick={onOpenSidebar}
            className={`lg:hidden p-2.5 rounded-full transition-colors ${iconBtnClass}`}
            aria-label="Open menu"
          >
            <Menu size={22} />
          </button>
        </div>
      </div>
    </header>
  );
}
