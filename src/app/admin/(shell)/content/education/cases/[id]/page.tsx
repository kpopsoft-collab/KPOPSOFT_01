import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { CaseForm } from "@/components/admin/content/education/cases/case-form";
import { EducationImageGallery } from "@/components/admin/content/education/image-gallery";
import {
  addEducationImage,
  removeEducationImage,
  updateEducationImage,
} from "../../image-actions";
import { updateCase } from "../actions";

export default async function EditEducationCasePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getContentData();
  const [item, images] = await Promise.all([
    data.education.cases.get(id),
    data.education.images.listByOwner("case", id),
  ]);
  if (!item) notFound();

  const revalidateHref = `/admin/content/education/cases/${id}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <Link
          href="/admin/content/education/cases"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 사례
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">사례 수정</h1>
      </div>
      <CaseForm initial={item} onSave={updateCase.bind(null, id)} />

      <div className="flex flex-col gap-4 border-t border-ink/10 pt-8">
        <div>
          <h2 className="text-lg font-extrabold text-ink">현장 · 결과물 · 상세 갤러리</h2>
          <p className="mt-1 text-sm text-ink/55">
            이미지별로 공개 여부와 Blur 처리를 설정할 수 있습니다(§24). 공개할 수
            없는 이미지는 &quot;공개&quot; 체크를 해제하거나 &quot;Blur 처리&quot;를 켜세요.
          </p>
        </div>
        <EducationImageGallery
          ownerType="case"
          ownerId={id}
          roleOptions={[
            { value: "site", label: "현장 이미지" },
            { value: "result", label: "결과물 이미지" },
            { value: "detail", label: "상세 갤러리" },
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
