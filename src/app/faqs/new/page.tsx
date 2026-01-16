import React from "react";
import FAQEditor from "@/components/admin/faqs/FAQEditor";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Add New FAQ",
  description: "Create a new support question"
};

export default function NewFAQPage() {
  return <FAQEditor />;
}