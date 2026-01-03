import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Metadata } from "next";

interface Props {
  params: Promise<{ slug: string }>;
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } });
  if (!page) return {};

  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
  };
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ 
    where: { slug } 
  });

  // 404 if not found OR if draft (and we are assuming public view)
  // (You could add logic here to allow admins to see drafts via cookies/headers)
  if (!page || !page.isPublished) {
    return notFound();
  }

  return (
    <main className="max-w-4xl mx-auto px-4 py-12 animate-in fade-in">
      <div className="mb-8">
        <h1 className="text-4xl md:text-5xl font-black text-primary mb-4">{page.title}</h1>
      </div>
      
      {/* Render HTML Content */}
      <article 
        className="prose dark:prose-invert prose-lg max-w-none text-secondary"
        dangerouslySetInnerHTML={{ __html: page.content }}
      />
    </main>
  );
}