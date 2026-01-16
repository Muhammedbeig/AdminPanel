import type { Metadata } from "next";
import RobotsClient from "@/app/seo/robots/RobotsClient";

export const metadata: Metadata = {
  title: "Robots.txt Editor",
  description: "Configure search engine crawling rules",
};

export default function RobotsPage() {
  return <RobotsClient />;
}