import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { ProgramForm } from "@/components/admin/content/education/programs/program-form";
import { EducationImageGallery } from "@/components/admin/content/education/image-gallery";
import {
  addEducationImage,
  removeEducationImage,
  updateEducationImage,
} from "../../image-actions";
import { updateProgram } from "../actions";

export default async function EditEducationProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getContentData();
  const [item, experts, images] = await Promise.all([
    data.education.programs.get(id),
    data.experts.list(),
    data.education.images.listByOwner("program", id),
  ]);
  if (!item) notFound();

  const revalidateHref = `/admin/content/education/programs/${id}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <Link
          href="/admin/content/education/programs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 프로그램
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">프로그램 수정</h1>
      </div>
      <ProgramForm initial={item} experts={experts} onSave={updateProgram.bind(null, id)} />

      <div className="flex flex-col gap-4 border-t border-ink/10 pt-8">
        <div>
          <h2 className="text-lg font-extrabold text-ink">결과물 · 교육 현장 이미지</h2>
          <p className="mt-1 text-sm text-ink/55">
            프로그램 카드/상세에서 사용할 결과물·현장 이미지를 관리합니다.
          </p>
        </div>
        <EducationImageGallery
          ownerType="program"
          ownerId={id}
          roleOptions={[
            { value: "output", label: "결과물 이미지" },
            { value: "site", label: "교육 현장 이미지" },
          ]}
          initialImages={images}
          addAction={addEducationImage.bind(null, revalidateHref)}
          updateAction={updateEducationImage.bind(null, revalidateHref)}
          removeAction={removeEducationImage.bind(null, revalidateHref)}
        />
      </div>
    </div>
  );
}
