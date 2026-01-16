import { Suspense } from "react";
import { Metadata } from "next";
import TermsSeoClient from "./TermsSeoClient";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Terms & Conditions",
};

export default function TermsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TermsSeoClient />
    </Suspense>
  );
}