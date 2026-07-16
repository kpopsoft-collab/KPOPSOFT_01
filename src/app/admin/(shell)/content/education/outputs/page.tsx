import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteOutput, setOutputPublished } from "./actions";

export default async function EducationOutputsListPage() {
  const items = await getContentData().education.outputs.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">교육 결과물</h1>
          <p className="mt-2 text-sm text-ink/55">
            수강생이 직접 만든 결과물을 등록·수정·삭제하고 갤러리를 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/content/education/outputs/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          결과물 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 결과물이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((o) => (
            <li
              key={o.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {o.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={o.coverImageUrl} alt={o.title} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-extrabold text-ink/30">
                    {o.title.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{o.title}</p>
                <p className="truncate text-sm text-ink/55">{o.category}</p>
              </div>

              <PublishToggle
                id={o.id}
                isPublished={o.isPublished}
                action={setOutputPublished}
              />
              <EditLink href={`/admin/content/education/outputs/${o.id}`} />
              <DeleteButton id={o.id} action={deleteOutput} label={`결과물 '${o.title}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
