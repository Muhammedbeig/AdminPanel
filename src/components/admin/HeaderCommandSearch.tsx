"use client";

import React, { useEffect, useState, useMemo, useRef } from "react";
import { useRouter } from "next/navigation";
import { 
  Search, LayoutDashboard, Image as ImageIcon,
  PenTool, FileText, Command, Globe, Shield, User,
  Sun, Moon, Settings, LogOut, ArrowRight,
  HelpCircle, Tag, Sliders, Monitor, PlusCircle,
  Link2Off, ArrowRightLeft, FileJson, Bot,
  // ✅ NEW IMPORTS for added features
  Calendar, Trash2, ImageMinus, Layers, Tags, Plus
} from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";
import { useAdminAuth } from "@/components/admin/auth/AdminAuthProvider";

export default function HeaderCommandSearch() {
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const { logout } = useAdminAuth();
  const isDark = theme === "dark"; 
  
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const commands = useMemo(() => [
    // --- MAIN ---
    { category: "Main", label: "Dashboard", icon: LayoutDashboard, action: () => router.push("/") },
    { category: "Main", label: "Media Library", icon: ImageIcon, action: () => router.push("/media") },
    { category: "Main", label: "Unused Media", icon: ImageMinus, action: () => router.push("/media/unused") },

    // --- KNOWLEDGE BASE (FAQs) ---
    { category: "Knowledge Base", label: "Manage FAQs", icon: HelpCircle, action: () => router.push("/faqs") },
    { category: "Knowledge Base", label: "Add New FAQ", icon: PlusCircle, action: () => router.push("/faqs/new") }, 
    { category: "Knowledge Base", label: "FAQ Categories", icon: Tag, action: () => router.push("/faqs/categories") },

    // --- BLOG ---
    { category: "Blog", label: "All Posts", icon: PenTool, action: () => router.push("/blogs") },
    { category: "Blog", label: "Write New Post", icon: FileText, action: () => router.push("/blogs/new") },
    { category: "Blog", label: "Categories", icon: Command, action: () => router.push("/blogs/categories") },
    { category: "Blog", label: "Tags", icon: Tags, action: () => router.push("/blogs/tags") },
    { category: "Blog", label: "Scheduled Posts", icon: Calendar, action: () => router.push("/blogs/scheduled") },
    { category: "Blog", label: "Trash", icon: Trash2, action: () => router.push("/blogs/trash") },

    // --- SEO MANAGER ---
    { category: "SEO", label: "Global SEO", icon: Globe, action: () => router.push("/seo/global") },
    { category: "SEO", label: "League SEO", icon: Shield, action: () => router.push("/seo/league") },
    { category: "SEO", label: "Player SEO", icon: User, action: () => router.push("/seo/player") },
    { category: "SEO", label: "Redirect Manager", icon: ArrowRightLeft, action: () => router.push("/seo/redirects") },
    { category: "SEO", label: "Sitemap Manager", icon: FileJson, action: () => router.push("/seo/sitemap") },
    { category: "SEO", label: "Broken Link Checker", icon: Link2Off, action: () => router.push("/seo/broken-links") },
    { category: "SEO", label: "Robots.txt Editor", icon: Bot, action: () => router.push("/seo/robots") },

    // --- SETTINGS (System & Web) ---
    { category: "Settings", label: "System Settings", icon: Sliders, action: () => router.push("/settings/system") },
    { category: "Settings", label: "Web Settings", icon: Monitor, action: () => router.push("/settings/web") },
    { category: "Settings", label: "Profile Settings", icon: Settings, action: () => router.push("/profile") },
    
    // --- PAGES (Static & Dynamic) ---
    { category: "Pages", label: "All Custom Pages", icon: Layers, action: () => router.push("/pages") },
    { category: "Pages", label: "Create New Page", icon: Plus, action: () => router.push("/pages/new") },
    { category: "Pages", label: "Edit Privacy Policy", icon: FileText, action: () => router.push("/seo/pages/privacy") },
    { category: "Pages", label: "Edit Terms of Service", icon: FileText, action: () => router.push("/seo/pages/terms") },
    { category: "Pages", label: "Edit Contact Page", icon: FileText, action: () => router.push("/seo/pages/contact") },

    // --- SYSTEM ---
    { category: "System", label: "Toggle Theme", icon: theme === "dark" ? Sun : Moon, action: () => setTheme(theme === "dark" ? "light" : "dark") },
    { category: "System", label: "Logout", icon: LogOut, action: () => logout() },
  ], [theme, router, logout, setTheme]);

  const filtered = commands.filter(cmd => 
    cmd.label.toLowerCase().includes(query.toLowerCase()) || 
    cmd.category.toLowerCase().includes(query.toLowerCase())
  );

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
      setSelectedIndex(prev => (prev + 1) % filtered.length);
    } else if (e.key === "ArrowUp") {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + filtered.length) % filtered.length);
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

  // --- DYNAMIC STYLE LOGIC ---
  const getContainerStyle = () => {
    if (isDark) return "bg-slate-900 border-slate-700 text-slate-200 placeholder-slate-500 shadow-inner";
    if (isOpen) return "bg-white border-transparent text-slate-800 placeholder-slate-400 shadow-xl"; 
    return "bg-white/10 border-white/10 text-white placeholder-white/70 hover:bg-white/20"; 
  };

  const getIconColor = () => {
    if (isDark) return "text-slate-400";
    if (isOpen) return "text-slate-400"; 
    return "text-white/80"; 
  };

  const getBadgeStyle = () => {
    if (isDark) return "bg-slate-800 border-slate-600 text-slate-400";
    if (isOpen) return "bg-slate-100 border-slate-200 text-slate-500";
    return "bg-black/10 border-white/20 text-white/80";
  };

  const getDropdownStyle = () => {
    if (isDark) return "bg-slate-900 border-slate-700 text-slate-200";
    return "bg-white border-slate-100 text-slate-800"; 
  };

  const getHoverStyle = (isSelected: boolean) => {
    if (isDark) {
      return isSelected ? "bg-blue-600 text-white" : "text-slate-300 hover:bg-slate-800";
    }
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
          className={`block w-full pl-10 pr-12 py-2.5 border leading-5 
                     transition-all duration-200 sm:text-sm font-medium focus:outline-none focus:ring-0
                     ${getContainerStyle()}
                     ${isOpen ? 'rounded-t-xl rounded-b-none' : 'rounded-xl'}
          `}
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
        <div className={`absolute top-full left-0 w-full border border-t-0 rounded-b-xl shadow-2xl overflow-hidden z-40 animate-in fade-in zoom-in-95 origin-top ${getDropdownStyle()}`}>
          
          {query.length === 0 && (
            <div className={`px-4 py-2 border-b text-[10px] font-bold uppercase tracking-wider ${isDark ? "bg-slate-800/50 border-slate-700 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
              Recent & Suggested
            </div>
          )}

          <div className="max-h-[60vh] overflow-y-auto p-2 space-y-1 custom-scrollbar">
            {filtered.length === 0 ? (
              <div className="py-8 text-center">
                <p className={`text-sm font-medium ${isDark ? "text-slate-500" : "text-slate-400"}`}>No matching commands.</p>
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
                    className={`w-full flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-100 ${getHoverStyle(isSelected)}`}
                  >
                    <div className="flex items-center gap-3">
                      <cmd.icon size={16} className={isSelected ? (isDark ? "text-white" : "text-blue-600") : (isDark ? "text-slate-500" : "text-slate-400")} />
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

          <div className={`px-4 py-2 border-t text-[10px] flex justify-between items-center ${isDark ? "bg-slate-950 border-slate-800 text-slate-500" : "bg-slate-50 border-slate-100 text-slate-400"}`}>
             <div className="flex gap-3">
               <span><strong>↑↓</strong> navigate</span>
               <span><strong>↵</strong> select</span>
             </div>
             <div>{filtered.length} results</div>
          </div>
        </div>
      )}
    </div>
  );
}