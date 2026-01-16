import { Suspense } from "react";
import { Metadata } from "next";
import PrivacySeoClient from "./PrivacySeoClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Privacy Policy",
};

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div>Loading Privacy Policy...</div>}>
      <PrivacySeoClient />
    </Suspense>
  );
}