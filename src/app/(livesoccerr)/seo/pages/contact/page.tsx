import { Suspense } from "react";
import ContactSeoClient from "./ContactSeoClient";

export const dynamic = "force-dynamic";

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Loading Contact Page...</div>}>
      <ContactSeoClient />
    </Suspense>
  );
}