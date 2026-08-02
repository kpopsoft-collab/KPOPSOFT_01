import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteTier, setTierPublished } from "./actions";

export default async function TierListPage() {
  const items = await getContentData().education.clubTiers.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">클럽 참여 유형</h1>
          <p className="mt-2 text-sm text-ink/55">바이브데이즈 참여 유형 3단계를 관리합니다.</p>
        </div>
        <Link
          href="/admin/content/education/club-tiers/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          클럽 참여 유형 추가
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
                <p className="truncate font-semibold text-ink">{item.name}</p>
                <p className="mt-0.5 truncate text-sm text-ink/55">{item.role}</p>
              </div>
              <PublishToggle
                id={item.id}
                isPublished={item.isPublished}
                action={setTierPublished}
              />
              <EditLink href={`/admin/content/education/club-tiers/${item.id}`} />
              <DeleteButton id={item.id} action={deleteTier} label={`'${item.name}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
