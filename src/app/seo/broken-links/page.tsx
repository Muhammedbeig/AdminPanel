import type { Metadata } from "next";
import BrokenLinksClient from "@/app/seo/broken-links/BrokenLinksClient";

export const metadata: Metadata = {
  title: "Broken Link Checker",
  description: "Scan and fix broken links",
};

export default function BrokenLinksPage() {
  return <BrokenLinksClient />;
}