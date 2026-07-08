import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteStat, setStatPublished } from "./actions";

export default async function StatsListPage() {
  const items = await getContentData().stats.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">수치</h1>
          <p className="mt-2 text-sm text-ink/55">회사 지표를 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/content/stats/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          수치 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 수치가 없습니다.
        </p>
      ) : (
        <ul className="grid gap-3 sm:grid-cols-2">
          {items.map((s) => (
            <li
              key={s.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="text-2xl font-extrabold tracking-tight text-ink">
                  {s.value.toLocaleString()}
                  <span className="text-brand-blue">{s.suffix}</span>
                </p>
                <p className="mt-0.5 truncate text-sm text-ink/55">{s.label}</p>
              </div>
              <PublishToggle id={s.id} isPublished={s.isPublished} action={setStatPublished} />
              <EditLink href={`/admin/content/stats/${s.id}`} />
              <DeleteButton id={s.id} action={deleteStat} label={`'${s.label}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
