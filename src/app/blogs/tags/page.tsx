import type { Metadata } from "next";
import TagsClient from "@/app/blogs/tags/TagsClient";

export const metadata: Metadata = {
  title: "Tags",
  description: "Manage blog tags",
};

export default function TagsPage() {
  return <TagsClient />;
}