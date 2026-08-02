import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { pillarKeyLabel } from "@/lib/admin/content-types";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deletePillarExample, setPillarExamplePublished } from "./actions";

export default async function PillarExamplesListPage() {
  const items = await getContentData().pillarExamples.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            핵심 비즈니스 사례
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            홈 카드를 누르면 열리는 사례 슬라이드입니다. Education 카드는 교육
            페이지로 이동하므로 슬라이드를 쓰지 않습니다.
          </p>
        </div>
        <Link
          href="/admin/content/pillar-examples/new"
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
          {items.map((item) => (
            <li
              key={item.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="min-w-0 flex-1">
                <p className="truncate font-semibold text-ink">
                  <span className="text-ink/45">{pillarKeyLabel[item.pillarKey]} · </span>
                  {item.name}
                </p>
                <p className="mt-0.5 truncate text-sm text-ink/55">{item.headline}</p>
              </div>
              <PublishToggle
                id={item.id}
                isPublished={item.isPublished}
                action={setPillarExamplePublished}
              />
              <EditLink href={`/admin/content/pillar-examples/${item.id}`} />
              <DeleteButton
                id={item.id}
                action={deletePillarExample}
                label={`'${item.name}'`}
              />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
