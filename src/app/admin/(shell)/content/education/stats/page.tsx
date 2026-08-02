import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteEduStat, setEduStatPublished } from "./actions";

export default async function EduStatListPage() {
  const items = await getContentData().education.stats.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">교육 성과</h1>
          <p className="mt-2 text-sm text-ink/55">교육 성과 수치를 관리합니다. 홈 수치와는 별개입니다.</p>
        </div>
        <Link
          href="/admin/content/education/stats/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          교육 성과 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 항목이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">{item.value}</p>
                <p className="mt-0.5 truncate text-sm text-ink/55">{item.label}</p>
              </div>
              <PublishToggle
                id={item.id}
                isPublished={item.isPublished}
                action={setEduStatPublished}
              />
              <EditLink href={`/admin/content/education/stats/${item.id}`} />
              <DeleteButton id={item.id} action={deleteEduStat} label={`'${item.label}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
