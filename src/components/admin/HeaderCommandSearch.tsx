"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  Search,
  LayoutDashboard,
  Image as ImageIcon,
  PenTool,
  FileText,
  Command,
  Globe,
  Shield,
  User,
  Sun,
  Moon,
  Settings,
  LogOut,
  ArrowRight,
  HelpCircle,
  Tag,
  Sliders,
  Monitor,
  PlusCircle,
  Link2Off,
  ArrowRightLeft,
  FileJson,
  Bot,
  Calendar,
  Trash2,
  ImageMinus,
  Layers,
  Tags,
  Plus,
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type Role = "ADMIN" | "EDITOR" | "SEO_MANAGER" | "CONTENT_WRITER" | "DEVELOPER";

export default function HeaderCommandSearch() {
  const router = useRouter();

  // ✅ FIX: ThemeContextType doesn't have setTheme -> use toggleTheme instead
  const { theme, toggleTheme } = useTheme();

  const { user, logout } = useAdminAuth();
  const role = user?.role as Role | undefined;

  const isDark = theme === "dark";

  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const allCommands = useMemo(
    () => [
      // --- MAIN (No Developer) ---
      {
        category: "Main",
        label: "Dashboard",
        icon: LayoutDashboard,
        action: () => router.push("/"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"],
      },
      {
        category: "Main",
        label: "Media Library",
        icon: ImageIcon,
        action: () => router.push("/media"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"],
      },
      {
        category: "Main",
        label: "Unused Media",
        icon: ImageMinus,
        action: () => router.push("/media/unused"),
        roles: ["ADMIN", "EDITOR"],
      },

      // --- KNOWLEDGE BASE (No Create for SEO/Editor) ---
      {
        category: "Knowledge Base",
        label: "Manage FAQs",
        icon: HelpCircle,
        action: () => router.push("/faqs"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "Knowledge Base",
        label: "Add New FAQ",
        icon: PlusCircle,
        action: () => router.push("/faqs/new"),
        roles: ["ADMIN"], // ✅ Admin only
      },
      {
        category: "Knowledge Base",
        label: "FAQ Categories",
        icon: Tag,
        action: () => router.push("/faqs/categories"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },

      // --- BLOG (No Create for SEO/Editor) ---
      {
        category: "Blog",
        label: "All Posts",
        icon: PenTool,
        action: () => router.push("/blogs"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"],
      },
      {
        category: "Blog",
        label: "Write New Post",
        icon: FileText,
        action: () => router.push("/blogs/new"),
        roles: ["ADMIN", "CONTENT_WRITER"], // ✅ Admin & Writer only
      },
      {
        category: "Blog",
        label: "Categories",
        icon: Command,
        action: () => router.push("/blogs/categories"),
        roles: ["ADMIN", "EDITOR"],
      },
      {
        category: "Blog",
        label: "Tags",
        icon: Tags,
        action: () => router.push("/blogs/tags"),
        roles: ["ADMIN", "EDITOR"],
      },
      {
        category: "Blog",
        label: "Scheduled Posts",
        icon: Calendar,
        action: () => router.push("/blogs/scheduled"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "Blog",
        label: "Trash",
        icon: Trash2,
        action: () => router.push("/blogs/trash"),
        roles: ["ADMIN", "EDITOR", "CONTENT_WRITER"],
      },

      // --- SEO MANAGER (No Developer) ---
      {
        category: "SEO",
        label: "Global SEO",
        icon: Globe,
        action: () => router.push("/seo/global"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "League SEO",
        icon: Shield,
        action: () => router.push("/seo/league"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "Player SEO",
        icon: User,
        action: () => router.push("/seo/player"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "Redirect Manager",
        icon: ArrowRightLeft,
        action: () => router.push("/seo/redirects"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "Sitemap Manager",
        icon: FileJson,
        action: () => router.push("/seo/sitemap"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "Broken Link Checker",
        icon: Link2Off,
        action: () => router.push("/seo/broken-links"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "SEO",
        label: "Robots.txt Editor",
        icon: Bot,
        action: () => router.push("/seo/robots"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },

      // --- SETTINGS (Developer & Admin ONLY) ---
      {
        category: "Settings",
        label: "System Settings",
        icon: Sliders,
        action: () => router.push("/settings/system"),
        roles: ["ADMIN", "DEVELOPER"],
      },
      {
        category: "Settings",
        label: "Web Settings",
        icon: Monitor,
        action: () => router.push("/settings/web"),
        roles: ["ADMIN", "DEVELOPER"],
      },
      {
        category: "Settings",
        label: "Profile Settings",
        icon: Settings,
        action: () => router.push("/profile"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER", "DEVELOPER"],
      },

      // --- PAGES (No Create for SEO/Editor) ---
      {
        category: "Pages",
        label: "All Custom Pages",
        icon: Layers,
        action: () => router.push("/pages"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "Pages",
        label: "Create New Page",
        icon: Plus,
        action: () => router.push("/pages/new"),
        roles: ["ADMIN"], // ✅ Admin only
      },
      {
        category: "Pages",
        label: "Edit Privacy Policy",
        icon: FileText,
        action: () => router.push("/seo/pages/privacy"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "Pages",
        label: "Edit Terms of Service",
        icon: FileText,
        action: () => router.push("/seo/pages/terms"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },
      {
        category: "Pages",
        label: "Edit Contact Page",
        icon: FileText,
        action: () => router.push("/seo/pages/contact"),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER"],
      },

      // --- SYSTEM (All) ---
      {
        category: "System",
        label: "Toggle Theme",
        icon: theme === "dark" ? Sun : Moon,
        // ✅ FIX: use toggleTheme() instead of setTheme(...)
        action: () => toggleTheme(),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER", "DEVELOPER"],
      },
      {
        category: "System",
        label: "Logout",
        icon: LogOut,
        action: () => logout(),
        roles: ["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER", "DEVELOPER"],
      },
    ],
    [theme, router, logout, toggleTheme]
  );

  const filtered = useMemo(() => {
    if (!role) return [];

    return allCommands.filter((cmd) => {
      const hasPermission = cmd.roles.includes(role);
      if (!hasPermission) return false;

      const q = query.toLowerCase();
      const matchesQuery = cmd.label.toLowerCase().includes(q) || cmd.category.toLowerCase().includes(q);

      return matchesQuery;
    });
  }, [allCommands, role, query]);

  useEffect(() => setSelectedIndex(0), [query]);

  useEffect(() => {
    const down = (e: KeyboardEvent) => {
      if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
        e.preventDefault();
        inputRef.current?.focus();
        setIsOpen(true);
      }
    };
    document.addEventListener("keydown", down);
    return () => document.removeEventListener("keydown", down);
  }, []);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!isOpen) {
      if (e.key === "ArrowDown" || e.key === "Enter") setIsOpen(true);
      return;
    }
    if (e.key === "ArrowDown") {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev + 1) % filtered.length : 0));
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex((prev) => (filtered.length ? (prev - 1 + filtered.length) % filtered.length : 0));
    } else if (e.key === "Enter") {
      e.preventDefault();
      if (filtered[selectedIndex]) {
        filtered[selectedIndex].action();
        setIsOpen(false);
        setQuery("");
        inputRef.current?.blur();
      }
    } else if (e.key === "Escape") {
      setIsOpen(false);
      inputRef.current?.blur();
    }
  };

  useEffect(() => {
    const handleClick = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  const getContainerStyle = () => {
    if (isDark) return "bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 shadow-inner";
    if (isOpen) return "bg-white border-transparent text-slate-800 placeholder-slate-400 shadow-xl";
    return "bg-white/10 border-white/10 text-white placeholder-white/70 hover:bg-white/20";
  };

  const getIconColor = () => (isDark || isOpen ? "text-slate-400" : "text-white/80");

  const getBadgeStyle = () => {
    if (isDark) return "bg-slate-800 border-slate-600 text-slate-400";
    if (isOpen) return "bg-slate-100 border-slate-200 text-slate-500";
    return "bg-black/10 border-white/20 text-white/80";
  };

  const getDropdownStyle = () =>
    isDark ? "bg-slate-900 border-slate-700 text-slate-200" : "bg-white border-slate-100 text-slate-800";

  const getHoverStyle = (isSelected: boolean) => {
    if (isDark) return isSelected ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800";
    return isSelected ? "bg-blue-50 text-blue-700" : "text-slate-600 hover:bg-slate-50";
  };

  return (
    <div ref={containerRef} className="relative w-full max-w-xl mx-auto">
      <div className="relative group z-50">
        <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
          <Search size={16} className={`${getIconColor()} transition-colors duration-200`} />
        </div>

        <input
          ref={inputRef}
          type="text"
          className={`block w-full pl-10 pr-12 py-2.5 border leading-5 transition-all duration-200 sm:text-sm font-medium focus:outline-none focus:ring-0 ${getContainerStyle()} ${
            isOpen ? "rounded-t-xl rounded-b-none" : "rounded-xl"
          }`}
          placeholder="Search or jump to..."
          value={query}
          onChange={(e) => {
            setQuery(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => setIsOpen(true)}
          onKeyDown={handleKeyDown}
        />

        <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
          <span className={`text-[10px] font-bold border rounded px-1.5 py-0.5 transition-colors duration-200 ${getBadgeStyle()}`}>
            ⌘K
          </span>
        </div>
      </div>

      {isOpen && (
        <div
          className={`absolute top-full left-0 w-full border border-t-0 rounded-b-xl shadow-2xl overflow-hidden z-40 animate-in fade-in zoom-in-95 origin-top ${getDropdownStyle()}`}
        >
          {query.length === 0 && (
            <div
              className={`px-4 py-2 border-b text-[10px] font-bold uppercase tracking-wider ${
                isDark ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
              }`}
            >
              Recent & Suggested
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>
                  {role ? "No matching commands." : "Loading permissions..."}
                </p>
              </div>
            ) : (
              filtered.map((cmd, i) => {
                const isSelected = i === selectedIndex;
                return (
                  <button
                    key={i}
                    onClick={() => {
                      cmd.action();
                      setIsOpen(false);
                      setQuery("");
                    }}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 ${getHoverStyle(
                      isSelected
                    )}`}
                  >
                    <div className="flex items-center gap-3">
                      <cmd.icon
                        size={16}
                        className={
                          isSelected ? (isDark ? "text-white" : "text-blue-600") : isDark ? "text-slate-500" : "text-slate-400"
                        }
                      />
                      <span>{cmd.label}</span>
                    </div>
                    <div className="flex items-center gap-3">
                      <span className={`text-[10px] uppercase tracking-wider ${isSelected ? (isDark ? "text-blue-200" : "text-blue-400") : "opacity-50"}`}>
                        {cmd.category}
                      </span>
                      {isSelected && <ArrowRight size={14} className="opacity-80" />}
                    </div>
                  </button>
                );
              })
            )}
          </div>

          <div
            className={`px-4 py-2 border-t text-[10px] flex justify-between items-center ${
              isDark ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"
            }`}
          >
            <div className="flex gap-3">
              <span>
                <strong>↑↓</strong> navigate
              </span>
              <span>
                <strong>↵</strong> select
              </span>
            </div>
            <div>{filtered.length} results</div>
          </div>
        </div>
      )}
    </div>
  );
}
