import Link from "next/link";
import { Plus, Pencil } from "lucide-react";

import { getInquiryOptionsData } from "@/lib/admin/inquiry-options";
import { DeleteButton, PublishToggle } from "@/components/admin/content/row-actions";
import { deleteType, setTypeActive } from "./actions";

export default async function InquiryOptionsListPage() {
  const types = await getInquiryOptionsData().listTypes();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            문의 옵션
          </h1>
          <p className="mt-2 text-sm text-ink/55">
            문의 폼의 유형과 세부 유형(예시 문구 포함)을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/content/inquiry-options/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          유형 추가
        </Link>
      </div>

      {types.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 문의 유형이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-4">
          {types.map((t) => (
            <li
              key={t.id}
              className="rounded-2xl border border-border bg-card p-5"
            >
              <div className="flex items-center gap-3">
                <p className="flex-1 truncate text-lg font-bold text-ink">
                  {t.label}
                </p>
                <PublishToggle
                  id={t.id}
                  isPublished={t.isActive}
                  action={setTypeActive}
                />
                <Link
                  href={`/admin/content/inquiry-options/${t.id}`}
                  className="inline-flex min-h-9 items-center gap-1.5 rounded-lg border border-ink/15 px-3 text-sm font-semibold text-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue"
                >
                  <Pencil className="size-4" aria-hidden />
                  세부 유형 관리
                </Link>
                <DeleteButton
                  id={t.id}
                  action={deleteType}
                  label={`유형 '${t.label}'`}
                />
              </div>

              {t.subtypes.length > 0 && (
                <ul className="mt-4 flex flex-wrap gap-2 border-t border-ink/10 pt-4">
                  {t.subtypes.map((s) => (
                    <li
                      key={s.id}
                      className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                        s.isActive
                          ? "bg-ivory/70 text-ink/70"
                          : "bg-ink/5 text-ink/35 line-through"
                      }`}
                    >
                      {s.label}
                    </li>
                  ))}
                </ul>
              )}
              <p className="mt-3 text-xs text-ink/40">
                세부 유형 {t.subtypes.length}개
                {t.subtypes.length > 5 && " · 폼에서 드롭다운으로 표시됨"}
              </p>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
