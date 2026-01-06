import React from "react";
import { Metadata } from "next";
// Import the component you just created in the components folder
import WebSettingsClient from "@/app/settings/WebSettingsClient"; 

export const metadata: Metadata = {
  title: "Web Settings",
  description: "Manage website settings",
};

export default function WebSettingsPage() {
  return (
    <>
      <WebSettingsClient />
    </>
  );
}