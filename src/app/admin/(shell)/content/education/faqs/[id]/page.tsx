import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { FaqForm } from "@/components/admin/content/education/faqs/faq-form";
import { updateFaq } from "../actions";

export default async function EditFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.faqs.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/faqs"
      backLabel="FAQ"
      title="FAQ 수정"
    >
      <FaqForm initial={item} onSave={updateFaq.bind(null, id)} />
    </ContentFormShell>
  );
}
