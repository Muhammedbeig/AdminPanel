import React from "react";
import { Metadata } from "next";
// Import the Client Component you already built
import SettingsClient from "@/app/settings/SettingsClient"; 

export const metadata: Metadata = {
  title: "System Settings",
  description: "Configure system preferences",
};

export default function SystemSettingsPage() {
  return (
    <>
      <SettingsClient />
    </>
  );
}