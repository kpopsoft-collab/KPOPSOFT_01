import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { accentBg } from "@/lib/site";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteWork, setWorkPublished } from "./actions";

export default async function WorkListPage() {
  const items = await getContentData().work.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Work</h1>
          <p className="mt-2 text-sm text-ink/55">포트폴리오를 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/content/work/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          프로젝트 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 프로젝트가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((w) => (
            <li
              key={w.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {w.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={w.imageUrl} alt={w.title} className="size-full object-cover" />
                ) : (
                  <span className={`block size-full ${accentBg[w.accent]}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{w.title}</p>
                <p className="truncate text-sm text-ink/55">
                  {w.client}
                  {w.category && ` · ${w.category}`}
                </p>
              </div>
              <PublishToggle id={w.id} isPublished={w.isPublished} action={setWorkPublished} />
              <EditLink href={`/admin/content/work/${w.id}`} />
              <DeleteButton id={w.id} action={deleteWork} label={`'${w.title}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
