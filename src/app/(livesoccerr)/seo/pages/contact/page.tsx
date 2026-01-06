import { Suspense } from "react";
import { Metadata } from "next";
import ContactSeoClient from "./ContactSeoClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Contact Page",
};

export default function ContactPage() {
  return (
    <Suspense fallback={<div>Loading Contact Page...</div>}>
      <ContactSeoClient />
    </Suspense>
  );
}