import type { Metadata } from "next";
import FAQListClient from "@/app/faqs/FAQListClient";

export const metadata: Metadata = {
  title: "FAQ Manager",
  description: "Manage customer support FAQs",
};

export default function FAQListPage() {
  return <FAQListClient />;
}