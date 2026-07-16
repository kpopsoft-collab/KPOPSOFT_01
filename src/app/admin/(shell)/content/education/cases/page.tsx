import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteCase, setCasePublished } from "./actions";

export default async function EducationCasesListPage() {
  const items = await getContentData().education.cases.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">교육 사례</h1>
          <p className="mt-2 text-sm text-ink/55">
            기업 교육 사례를 등록·수정·삭제하고 이미지를 관리합니다. 공개 가능한
            사례가 없으면 전체를 숨길 수 있습니다.
          </p>
        </div>
        <Link
          href="/admin/content/education/cases/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          사례 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 사례가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((c) => (
            <li
              key={c.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {c.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={c.coverImageUrl} alt={c.title} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-extrabold text-ink/30">
                    {c.title.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{c.title}</p>
                <p className="truncate text-sm text-ink/55">
                  {[c.industry, c.participantCount].filter(Boolean).join(" · ")}
                </p>
              </div>

              <PublishToggle
                id={c.id}
                isPublished={c.isPublished}
                action={setCasePublished}
              />
              <EditLink href={`/admin/content/education/cases/${c.id}`} />
              <DeleteButton id={c.id} action={deleteCase} label={`사례 '${c.title}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
