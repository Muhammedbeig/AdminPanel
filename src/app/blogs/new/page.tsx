"use client";

import React from "react";
import RoleGuard from "@/components/admin/auth/RoleGuard";
import BlogEditor from "@/components/admin/blogs/BlogEditor"; // Imports the new component

export default function NewBlogPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]}>
      <BlogEditor />
    </RoleGuard>
  );
}