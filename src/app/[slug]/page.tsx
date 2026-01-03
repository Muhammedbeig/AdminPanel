import { notFound } from "next/navigation";
import { prisma } from "@/lib/db/prisma";
import { Metadata } from "next"; // [cite: 1]

interface Props {
  params: Promise<{ slug: string }>;
}

// SEO Metadata Generation
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const page = await prisma.page.findUnique({ where: { slug } }); // [cite: 3]
  if (!page) return {};
  
  return {
    title: page.metaTitle || page.title,
    description: page.metaDescription,
  }; // [cite: 4]
}

export default async function DynamicPage({ params }: Props) {
  const { slug } = await params;
  
  const page = await prisma.page.findUnique({ 
    where: { slug } 
  }); // [cite: 6]

  // 404 if not found OR if draft
  if (!page || !page.isPublished) {
    return notFound(); // [cite: 7]
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
  ); // [cite: 8]
}