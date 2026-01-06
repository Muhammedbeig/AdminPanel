import React from "react";
import MediaLibrary from "@/components/admin/media/MediaLibrary";
import RoleGuard from "@/components/admin/auth/RoleGuard";

// ✅ Add Title
export const metadata = {
  title: "Media Library",
};

export default function MediaPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR"]}>
      <div className="max-w-[1600px] mx-auto pb-10 space-y-6 animate-in fade-in duration-500 h-full flex flex-col">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 py-4 px-4 md:px-0 shrink-0">
          <div>
            <h1 className="text-3xl font-black text-primary">Media Library</h1>
            <p className="text-sm text-secondary mt-1">
              Manage your uploads, create folders, and organize assets.
            </p>
          </div>
        </div>

        {/* The Library Component in "Page Mode" */}
        <div className="flex-1 min-h-[600px]">
          <MediaLibrary isModal={false} />
        </div>
      </div>
    </RoleGuard>
  );
}