"use client";

export default function AdminFooter() {
  return (
    <footer className="theme-border border-t mt-8">
      <div className="mx-auto max-w-7xl px-4 py-6 flex flex-col sm:flex-row gap-2 sm:items-center sm:justify-between">
        <div className="text-xs text-secondary">
          © {new Date().getFullYear()} Admin Panel
        </div>
        <div className="text-xs text-secondary">
          Manage SEO & content safely.
        </div>
      </div>
    </footer>
  );
}
