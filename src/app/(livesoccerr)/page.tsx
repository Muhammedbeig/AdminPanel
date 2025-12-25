import Link from "next/link";

export const dynamic = "force-dynamic";

export default function LiveSocceRRAdminHome() {
  return (
    <div className="theme-bg theme-border border rounded-xl p-6 space-y-4">
      <div>
        <div className="text-lg font-black text-primary">Admin Panel</div>
        <div className="text-sm text-secondary">Manage SEO, members, and settings.</div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        <Link className="theme-bg theme-border border rounded-xl p-4 hover:bg-black/5 dark:hover:bg-white/10" href="/seo/global">
          <div className="text-sm font-black text-primary">Global SEO</div>
          <div className="text-xs text-secondary mt-1">Edit site-wide SEO defaults, branding, keywords.</div>
        </Link>

        <Link className="theme-bg theme-border border rounded-xl p-4 hover:bg-black/5 dark:hover:bg-white/10" href="/settings/members">
          <div className="text-sm font-black text-primary">Members</div>
          <div className="text-xs text-secondary mt-1">Manage admin users and roles.</div>
        </Link>
      </div>
    </div>
  );
}
