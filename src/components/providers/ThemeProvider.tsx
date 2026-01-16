"use client";

import React, { createContext, useContext, useEffect, useMemo, useState } from "react";

type Theme = "light" | "dark";
type ThemeCtx = { theme: Theme; toggleTheme: () => void; setTheme: (t: Theme) => void };

const Ctx = createContext<ThemeCtx | null>(null);

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [theme, setThemeState] = useState<Theme>("light");

  useEffect(() => {
    const saved = (localStorage.getItem("admin_theme") as Theme | null) || "light";
    setThemeState(saved);
  }, []);

  useEffect(() => {
    document.documentElement.classList.toggle("dark", theme === "dark");
    localStorage.setItem("admin_theme", theme);
  }, [theme]);

  const value = useMemo<ThemeCtx>(
    () => ({
      theme,
      setTheme: (t) => setThemeState(t),
      toggleTheme: () => setThemeState((t) => (t === "dark" ? "light" : "dark")),
    }),
    [theme]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useTheme() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useTheme must be used within ThemeProvider");
  return ctx;
}
