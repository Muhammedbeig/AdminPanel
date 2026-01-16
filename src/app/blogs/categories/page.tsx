import type { Metadata } from "next";
import CategoriesClient from "@/app/blogs/categories/CategoriesClient";

export const metadata: Metadata = {
  title: "Categories",
  description: "Manage blog categories",
};

export default function CategoriesPage() {
  return <CategoriesClient />;
}