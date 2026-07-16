import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { educationRecruitStatusLabel } from "@/lib/admin/content-types";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteProgram, setProgramPublished } from "./actions";

export default async function EducationProgramsListPage() {
  const items = await getContentData().education.programs.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">교육 프로그램</h1>
          <p className="mt-2 text-sm text-ink/55">
            프로그램을 등록·수정·삭제하고 담당 강사, 모집 상태, 이미지를 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/content/education/programs/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          프로그램 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 프로그램이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((p) => (
            <li
              key={p.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {p.coverImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img src={p.coverImageUrl} alt={p.name} className="size-full object-cover" />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-extrabold text-ink/30">
                    {p.name.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">
                  {p.name}
                  {p.isFeatured && (
                    <span className="ml-2 rounded-full bg-brand-yellow/25 px-2 py-0.5 text-xs font-bold text-brand-yellow-ink">
                      대표
                    </span>
                  )}
                </p>
                <p className="truncate text-sm text-ink/55">
                  {p.vibeLabel} · {educationRecruitStatusLabel[p.recruitStatus]}
                </p>
              </div>

              <PublishToggle
                id={p.id}
                isPublished={p.isPublished}
                action={setProgramPublished}
              />
              <EditLink href={`/admin/content/education/programs/${p.id}`} />
              <DeleteButton id={p.id} action={deleteProgram} label={`프로그램 '${p.name}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
