import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteTestimonial, setTestimonialPublished } from "./actions";

export default async function TestimonialsListPage() {
  const items = await getContentData().testimonials.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">후기</h1>
          <p className="mt-2 text-sm text-ink/55">고객 후기를 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/content/testimonials/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          후기 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 후기가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((t) => (
            <li
              key={t.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">“{t.quote}”</p>
                <p className="mt-1 truncate text-sm text-ink/55">
                  {t.author}
                  {t.program && ` · ${t.program}`}
                  {t.result && ` · ${t.result}`}
                </p>
              </div>
              <PublishToggle id={t.id} isPublished={t.isPublished} action={setTestimonialPublished} />
              <EditLink href={`/admin/content/testimonials/${t.id}`} />
              <DeleteButton id={t.id} action={deleteTestimonial} label="이 후기" />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
