import type { Metadata } from "next";
import RedirectsClient from "@/app/seo/redirects/RedirectsClient";

export const metadata: Metadata = {
  title: "Redirect Manager",
  description: "Manage 301/302 redirects",
};

export default function RedirectsPage() {
  return <RedirectsClient />;
}