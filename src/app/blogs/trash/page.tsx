import type { Metadata } from "next";
import TrashClient from "@/app/blogs/trash/TrashClient";

export const metadata: Metadata = {
  title: "Trash",
  description: "View and restore deleted blog posts",
};

export default function TrashPage() {
  return <TrashClient />;
}