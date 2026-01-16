import type { Metadata } from "next";
import FAQCategoriesClient from "@/app/faqs//categories/FAQCategoriesClient";

export const metadata: Metadata = {
  title: "FAQ Categories",
  description: "Manage FAQ categories",
};

export default function FAQCategoriesPage() {
  return <FAQCategoriesClient />;
}