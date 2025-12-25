"use client";

import React, { useEffect, useState } from "react";
import AdminHeader from "@/components/admin/AdminHeader";
import AdminSidebar from "@/components/admin/AdminSidebar";
import AdminFooter from "@/components/admin/AdminFooter";

export default function AdminShell({ children }: { children: React.ReactNode }) {
  const [open, setOpen] = useState(false);

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, []);

  return (
    <div className="min-h-screen theme-bg">
      <AdminHeader onOpenSidebar={() => setOpen(true)} />

      <div className="mx-auto max-w-7xl w-full">
        <div className="grid grid-cols-1 lg:grid-cols-[280px_1fr]">
          {/* Desktop sidebar */}
          <div className="hidden lg:block h-[calc(100vh-64px)] sticky top-[64px]">
            <AdminSidebar />
          </div>

          {/* Content */}
          <main className="px-4 py-6">
            <div className="max-w-6xl mx-auto">{children}</div>
            <AdminFooter />
          </main>
        </div>
      </div>

      {/* Mobile drawer */}
      {open ? (
        <div className="lg:hidden fixed inset-0 z-50">
          <button
            className="absolute inset-0 bg-black/50"
            onClick={() => setOpen(false)}
            aria-label="Close menu overlay"
          />
          <div className="absolute left-0 top-0 h-full w-[86%] max-w-[340px] theme-bg theme-border border-r shadow-2xl">
            <div className="h-16 px-4 flex items-center theme-border border-b">
              <div className="text-primary font-black">Navigation</div>
              <button
                onClick={() => setOpen(false)}
                className="ml-auto text-sm font-black text-secondary hover:text-primary"
              >
                Close
              </button>
            </div>
            <div className="h-[calc(100vh-64px)] overflow-y-auto">
              <AdminSidebar onNavigate={() => setOpen(false)} />
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
