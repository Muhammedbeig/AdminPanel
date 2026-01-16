import { Suspense } from "react";
import { Metadata } from "next";
import MatchSeoClient from "./MatchSeoClient";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Match SEO",
};

function Loading() {
  return (
    <div className="max-w-5xl mx-auto px-4 py-10">
      <div className="theme-bg theme-border border rounded-2xl p-6">
        <div className="text-xl font-black text-primary">Match SEO</div>
        <div className="text-sm text-secondary mt-2">Loading...</div>
      </div>
    </div>
  );
}

export default function MatchSeoPage() {
  return (
    <Suspense fallback={<Loading />}>
      <MatchSeoClient />
    </Suspense>
  );
}