import { prisma } from "@/lib/db/prisma";
import FAQEditor from "@/components/admin/faqs/FAQEditor";

// ✅ Fix: params must be a Promise in Next.js 15
export default async function EditFAQPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params; // ✅ Fix: Await the params
  
  const faq = await prisma.fAQ.findUnique({ where: { id: parseInt(id) } });
  
  if (!faq) return <div>FAQ not found</div>;
  
  return <FAQEditor initialData={faq} />;
}