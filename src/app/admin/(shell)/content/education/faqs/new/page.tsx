import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { FaqForm } from "@/components/admin/content/education/faqs/faq-form";
import { createFaq } from "../actions";

export default function NewFaqPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/faqs"
      backLabel="FAQ"
      title="FAQ 추가"
    >
      <FaqForm onSave={createFaq} />
    </ContentFormShell>
  );
}
