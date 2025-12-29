import { Suspense } from "react";
import PrivacySeoClient from "./PrivacySeoClient";

export const dynamic = "force-dynamic";

export default function PrivacyPage() {
  return (
    <Suspense fallback={<div>Loading Privacy Policy...</div>}>
      <PrivacySeoClient />
    </Suspense>
  );
}