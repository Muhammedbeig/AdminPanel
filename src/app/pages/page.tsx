import type { Metadata } from "next";
import PagesListClient from "@/app/pages/PagesListClient";

export const metadata: Metadata = {
  title: "Web Pages",
  description: "Manage static pages",
};

export default function PagesListPage() {
  return <PagesListClient />;
}