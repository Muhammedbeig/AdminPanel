import React from "react";
import { Metadata } from "next";
import RoleGuard from "@/components/admin/auth/RoleGuard";
import MembersClient from "./MembersClient";

export const metadata: Metadata = {
  title: "Members Management | Admin Dashboard",
  description: "Manage users, roles, and platform access.",
};

export default function MembersPage() {
  // ✅ Protect this page: Only ADMIN and DEVELOPER can enter.
  // SEO Managers, Editors, etc., will be redirected to the dashboard.
  return (
    <RoleGuard allowedRoles={["ADMIN", "DEVELOPER"]}>
      <MembersClient />
    </RoleGuard>
  );
}