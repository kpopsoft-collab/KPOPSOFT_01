import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { OutputForm } from "@/components/admin/content/education/outputs/output-form";
import { EducationImageGallery } from "@/components/admin/content/education/image-gallery";
import {
  addEducationImage,
  removeEducationImage,
  updateEducationImage,
} from "../../image-actions";
import { updateOutput } from "../actions";

export default async function EditEducationOutputPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getContentData();
  const [item, programs, images] = await Promise.all([
    data.education.outputs.get(id),
    data.education.programs.list(),
    data.education.images.listByOwner("output", id),
  ]);
  if (!item) notFound();

  const revalidateHref = `/admin/content/education/outputs/${id}`;

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-10">
      <div>
        <Link
          href="/admin/content/education/outputs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          교육 결과물
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">결과물 수정</h1>
      </div>
      <OutputForm initial={item} programs={programs} onSave={updateOutput.bind(null, id)} />

      <div className="flex flex-col gap-4 border-t border-ink/10 pt-8">
        <div>
          <h2 className="text-lg font-extrabold text-ink">갤러리 이미지</h2>
          <p className="mt-1 text-sm text-ink/55">
            결과물 상세에 노출되는 이미지를 관리합니다.
          </p>
        </div>
        <EducationImageGallery
          ownerType="output"
          ownerId={id}
          roleOptions={[{ value: "gallery", label: "갤러리" }]}
          initialImages={images}
          addAction={addEducationImage.bind(null, revalidateHref)}
          updateAction={updateEducationImage.bind(null, revalidateHref)}
          removeAction={removeEducationImage.bind(null, revalidateHref)}
        />
      </div>
    </div>
  );
}
