"use client";

import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/components/providers/ThemeProvider";

export default function AdminThemeToggle() {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === "dark";

  // ✅ Match reference button style on blue header vs dark header
  const btnClass = isDark
    ? "text-secondary hover:bg-slate-800"
    : "text-white/90 hover:bg-white/10 hover:text-white";

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`p-2.5 rounded-full transition-colors ${btnClass}`}
      aria-label="Toggle theme"
      title="Toggle theme"
    >
      {isDark ? <Sun size={20} /> : <Moon size={20} />}
    </button>
  );
}
