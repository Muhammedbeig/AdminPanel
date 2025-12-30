"use client";

import RoleGuard from "@/components/admin/auth/RoleGuard";
import SettingsClient from "./SettingsClient";

export default function SettingsPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "DEVELOPER"]}>
      <SettingsClient />
    </RoleGuard>
  );
}