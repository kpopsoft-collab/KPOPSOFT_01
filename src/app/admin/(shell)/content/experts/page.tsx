import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { accentBg } from "@/lib/site";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteExpert, setExpertPublished } from "./actions";

export default async function ExpertsListPage() {
  const experts = await getContentData().experts.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">강사진</h1>
          <p className="mt-2 text-sm text-ink/55">
            강사를 등록·수정·삭제하고 사진을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/content/experts/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          강사 추가
        </Link>
      </div>

      {experts.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 강사가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {experts.map((e) => (
            <li
              key={e.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {e.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={e.imageUrl} alt={e.name} className="size-full object-cover" />
                ) : (
                  <span
                    className={`flex size-full items-center justify-center text-lg font-extrabold text-white ${accentBg[e.accent]}`}
                  >
                    {e.name.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{e.name}</p>
                <p className="truncate text-sm text-ink/55">{e.role}</p>
                {e.tags.length > 0 && (
                  <p className="mt-1 truncate text-xs text-ink/40">
                    {e.tags.join(" · ")}
                  </p>
                )}
              </div>

              <PublishToggle
                id={e.id}
                isPublished={e.isPublished}
                action={setExpertPublished}
              />
              <EditLink href={`/admin/content/experts/${e.id}`} />
              <DeleteButton id={e.id} action={deleteExpert} label={`강사 '${e.name}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
