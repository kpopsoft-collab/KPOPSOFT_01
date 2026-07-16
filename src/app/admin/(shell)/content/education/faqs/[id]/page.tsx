import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { FaqForm } from "@/components/admin/content/education/faqs/faq-form";
import { updateFaq } from "../actions";

export default async function EditEducationFaqPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.faqs.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/faqs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          Education FAQ
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">FAQ 수정</h1>
      </div>
      <FaqForm initial={item} onSave={updateFaq.bind(null, id)} />
    </div>
  );
}
