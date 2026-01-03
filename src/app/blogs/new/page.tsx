import React from "react";
import RoleGuard from "@/components/admin/auth/RoleGuard";
import BlogEditor from "@/components/admin/blogs/BlogEditor"; 
import { Metadata } from "next";

// ✅ Added SEO Metadata
export const metadata: Metadata = {
  title: "Write New Post",
  description: "Create a new blog post"
};

export default function NewBlogPage() {
  return (
    <RoleGuard allowedRoles={["ADMIN", "EDITOR", "SEO_MANAGER", "CONTENT_WRITER"]}>
      <BlogEditor />
    </RoleGuard>
  );
}