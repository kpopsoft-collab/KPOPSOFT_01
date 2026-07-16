import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { FaqForm } from "@/components/admin/content/education/faqs/faq-form";
import { createFaq } from "../actions";

export default function NewEducationFaqPage() {
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
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">FAQ 추가</h1>
      </div>
      <FaqForm onSave={createFaq} />
    </div>
  );
}
