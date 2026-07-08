import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { accentBg } from "@/lib/site";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteInsight, setInsightPublished } from "./actions";

export default async function InsightsListPage() {
  const items = await getContentData().insights.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">Insights</h1>
          <p className="mt-2 text-sm text-ink/55">인사이트 글을 등록·수정·삭제합니다.</p>
        </div>
        <Link
          href="/admin/content/insights/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          글 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 글이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((n) => (
            <li
              key={n.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {n.imageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={n.imageUrl} alt={n.title} className="size-full object-cover" />
                ) : (
                  <span className={`block size-full ${accentBg[n.accent]}`} />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{n.title}</p>
                <p className="truncate text-sm text-ink/55">
                  {n.tag}
                  {n.date && ` · ${n.date}`}
                  <span className="text-ink/35"> · /{n.slug}</span>
                </p>
              </div>
              <PublishToggle id={n.id} isPublished={n.isPublished} action={setInsightPublished} />
              <EditLink href={`/admin/content/insights/${n.id}`} />
              <DeleteButton id={n.id} action={deleteInsight} label={`'${n.title}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
