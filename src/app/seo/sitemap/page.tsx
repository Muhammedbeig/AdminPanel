import type { Metadata } from "next";
import SitemapClient from "@/app/seo/sitemap/SitemapClient";

export const metadata: Metadata = {
  title: "Sitemap Manager",
  description: "Configure XML Sitemap settings",
};

export default function SitemapPage() {
  return <SitemapClient />;
}