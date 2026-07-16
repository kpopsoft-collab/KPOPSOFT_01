import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { educationFaqCategoryLabel } from "@/lib/admin/content-types";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteFaq, setFaqPublished } from "./actions";

export default async function EducationFaqsListPage() {
  const items = await getContentData().education.faqs.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Education FAQ</h1>
          <p className="mt-2 text-sm text-ink/55">
            개인 프로그램·기업 교육 FAQ를 등록·수정·삭제합니다.
          </p>
        </div>
        <Link
          href="/admin/content/education/faqs/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          FAQ 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 FAQ가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((f) => (
            <li
              key={f.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-xs font-bold text-brand-blue">
                  {educationFaqCategoryLabel[f.category]}
                </p>
                <p className="truncate font-bold text-ink">{f.question}</p>
                <p className="mt-1 truncate text-sm text-ink/55">{f.answer}</p>
              </div>

              <PublishToggle
                id={f.id}
                isPublished={f.isPublished}
                action={setFaqPublished}
              />
              <EditLink href={`/admin/content/education/faqs/${f.id}`} />
              <DeleteButton id={f.id} action={deleteFaq} label="이 FAQ" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
