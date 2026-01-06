import type { Metadata } from "next";
import AllBlogsClient from "@/app/blogs/AllBlogsClient";

export const metadata: Metadata = {
  title: "All Posts",
  description: "Browse all blog posts",
};

export default function AllBlogsPage() {
  return <AllBlogsClient />;
}