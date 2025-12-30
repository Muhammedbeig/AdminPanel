"use client";

import React from "react";
import RoleGuard from "@/components/admin/auth/RoleGuard";
import MembersClient from "./MembersClient";

export default function MembersPage() {
  // ✅ Protect this page: Only ADMIN and DEVELOPER can enter.
  // SEO Managers, Editors, etc., will be redirected to the dashboard.
  return (
    <RoleGuard allowedRoles={["ADMIN", "DEVELOPER"]}>
      <MembersClient />
    </RoleGuard>
  );
}