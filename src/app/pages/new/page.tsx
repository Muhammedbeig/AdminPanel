import React from "react";
import PageEditor from "@/components/admin/pages/PageEditor";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Create New Page",
  description: "Create a new static page"
};

export default function NewPage() { 
  return <PageEditor />; 
}