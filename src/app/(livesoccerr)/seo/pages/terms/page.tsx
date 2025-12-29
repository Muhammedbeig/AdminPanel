import { Suspense } from "react";
import TermsSeoClient from "./TermsSeoClient";

export const dynamic = "force-dynamic";

export default function TermsPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <TermsSeoClient />
    </Suspense>
  );
}