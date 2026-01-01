import { prisma } from "@/lib/db/prisma";
import FAQEditor from "@/components/admin/faqs/FAQEditor";

export default async function EditFAQPage({ params }: { params: { id: string } }) {
  const faq = await prisma.fAQ.findUnique({ where: { id: parseInt(params.id) } });
  if (!faq) return <div>FAQ not found</div>;
  return <FAQEditor initialData={faq} />;
}