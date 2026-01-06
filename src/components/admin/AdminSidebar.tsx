"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Globe, Trophy, User, Users, Shield, Settings,
  FileText, PenTool, Layers, Image as ImageIcon, HelpCircle, Tag,
  Tags, Calendar, Trash2, ArrowRightLeft, FileJson, Link2Off, Bot,
  ImageMinus, Plus
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

type NavItem = {
  href: string;
  label: string;
  icon: React.ReactNode;
  badge?: string;
  roles?: string[]; // If present, only these roles see this specific item
};

function normalizePath(p: string) {
  const x = (p || "").replace(/\/+$/, "");
  return x === "" ? "/" : x;
}

export default function AdminSidebar({ onNavigate }: { onNavigate?: () => void }) {
  const pathname = normalizePath(usePathname());
  const { theme } = useTheme();
  const { user } = useAdminAuth();
  const isDark = theme === "dark";

  const role = user?.role || "VIEWER"; 

  const isActive = (href: string) => {
    const h = normalizePath(href);
    if (h === "/") return pathname === "/";
    return pathname === h || pathname.startsWith(`${h}/`);
  };

  const activeCls = isDark
    ? "bg-white/5 text-primary border-blue-500"
    : "bg-blue-50 text-primary border-blue-600";

  const inactiveCls = isDark
    ? "text-secondary hover:bg-white/5 hover:text-primary border-transparent"
    : "text-secondary hover:bg-black/5 hover:text-primary border-transparent";

  const canSee = (allowedRoles?: string[]) => {
    if (!allowedRoles) return true;
    // Note: We removed the generic "ADMIN || DEVELOPER" bypass here 
    // to strictly enforce the "Developer only sees settings" rule.
    if (role === "ADMIN") return true; 
    return allowedRoles.includes(role);
  };

  const Section = ({ title, items, allowedRoles }: { title: string; items: NavItem[], allowedRoles?: string[] }) => {
    if (!canSee(allowedRoles)) return null;

    // Filter items inside the section
    const visibleItems = items.filter(item => !item.roles || canSee(item.roles));

    if (visibleItems.length === 0) return null;

    return (
      <div>
        <div className="mb-2 px-3 text-[11px] font-black text-secondary uppercase tracking-widest">
          {title}
        </div>
        <div className="space-y-1">
          {visibleItems.map((item) => {
            const active = isActive(item.href);
            return (
              <Link
                key={item.href}
                href={item.href}
                onClick={() => onNavigate?.()}
                className={[
                  "group flex items-center justify-between gap-3 px-3 py-2.5 rounded-xl text-sm font-bold border-l-4 transition-colors",
                  active ? activeCls : inactiveCls,
                ].join(" ")}
              >
                <span className="flex items-center gap-3 min-w-0">
                  <span className="shrink-0 opacity-90">{item.icon}</span>
                  <span className="truncate">{item.label}</span>
                </span>
                {item.badge && (
                  <span className="shrink-0 rounded-lg bg-blue-500/10 text-blue-500 px-2 py-0.5 text-[10px] font-black uppercase tracking-widest">
                    {item.badge}
                  </span>
                )}
              </Link>
            );
          })}
        </div>
      </div>
    );
  };

  // --- MENU DEFINITIONS ---

  const main: NavItem[] = [
    { href: "/", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { href: "/media", label: "Media Library", icon: <ImageIcon size={16} /> },
    { href: "/media/unused", label: "Unused Media", icon: <ImageMinus size={16} /> },
  ];

  const blogManager: NavItem[] = [
    { href: "/blogs", label: "All Posts", icon: <PenTool size={16} /> },
    
    // ✅ RULE: SEO Manager & Editor CANNOT create. Developer cannot access.
    { 
      href: "/blogs/new", label: "Write New", icon: <FileText size={16} />,
      roles: ["ADMIN", "CONTENT_WRITER"] 
    },
    
    { href: "/blogs/categories", label: "Categories", icon: <Layers size={16} /> },
    { href: "/blogs/tags", label: "Tags", icon: <Tags size={16} /> },
    { href: "/blogs/scheduled", label: "Scheduled", icon: <Calendar size={16} /> },
    { href: "/blogs/trash", label: "Trash", icon: <Trash2 size={16} /> },
  ];

  const knowledgeBase: NavItem[] = [
    { href: "/faqs", label: "Manage FAQs", icon: <HelpCircle size={16} /> },
    
    // ✅ RULE: SEO Manager & Editor CANNOT create.
    { 
      href: "/faqs/new", label: "Add New FAQ", icon: <FileText size={16} />,
      roles: ["ADMIN"] 
    },
    
    { href: "/faqs/categories", label: "FAQ Categories", icon: <Tag size={16} /> },
  ];

  const seoManager: NavItem[] = [
    { href: "/seo/global", label: "Global", icon: <Globe size={16} /> },
    { href: "/seo/match", label: "Match", icon: <Trophy size={16} />},
    { href: "/seo/player", label: "Player", icon: <User size={16} />},
    { href: "/seo/league", label: "League", icon: <Shield size={16} />},
    { href: "/seo/redirects", label: "Redirects", icon: <ArrowRightLeft size={16} /> },
    { href: "/seo/sitemap", label: "Sitemap", icon: <FileJson size={16} /> },
    { href: "/seo/broken-links", label: "Broken Links", icon: <Link2Off size={16} /> },
    { href: "/seo/robots", label: "Robots.txt", icon: <Bot size={16} /> },
  ];

  const pages: NavItem[] = [
    { href: "/seo/pages/terms", label: "Terms of Service", icon: <FileText size={16} /> },
    { href: "/seo/pages/privacy", label: "Privacy Policy", icon: <FileText size={16} /> },
    { href: "/seo/pages/contact", label: "Contact", icon: <FileText size={16} /> },
    { href: "/pages", label: "All Custom Pages", icon: <Layers size={16} /> },
    
    // ✅ RULE: SEO Manager & Editor CANNOT create.
    { 
      href: "/pages/new", label: "Add New Page", icon: <Plus size={16} />,
      roles: ["ADMIN"] 
    },
  ];

  const admin: NavItem[] = [
    { href: "/settings/members", label: "Members", icon: <Users size={16} /> },
    { href: "/settings", label: "Settings", icon: <Settings size={16} /> },
  ];

  return (
    <aside className="theme-bg theme-border border-r h-full flex flex-col">
      <nav className={[
        "flex-1 overflow-y-auto p-4 space-y-6",
        "[&::-webkit-scrollbar]:w-1.5",
        "[&::-webkit-scrollbar-track]:bg-transparent",
        "[&::-webkit-scrollbar-thumb]:bg-blue-600",
        "[&::-webkit-scrollbar-thumb]:rounded-full",
        "dark:[&::-webkit-scrollbar-thumb]:bg-white/10",
        "hover:[&::-webkit-scrollbar-thumb]:bg-blue-700",
        "dark:hover:[&::-webkit-scrollbar-thumb]:bg-white/20",
        "[scrollbar-width:thin]",
        "[scrollbar-color:#2563eb_transparent]",
        "dark:[scrollbar-color:rgba(255,255,255,0.1)_transparent]"
      ].join(" ")}>
        
        {/* ✅ RULE: Developer sees ONLY settings. */}
        
        <Section title="Main" items={main} allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]} />
        <Section title="Blog Manager" items={blogManager} allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]} />
        <Section title="Knowledge Base" items={knowledgeBase} allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]} />
        <Section title="SEO Manager" items={seoManager} allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER"]} />
        <Section title="Content Pages" items={pages} allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]} />
        
        {/* Settings: Visible to Admin and Developer */}
        <Section title="Admin" items={admin} allowedRoles={["ADMIN", "DEVELOPER"]} />

      </nav>
    </aside>
  );
}