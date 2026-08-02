import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { PastProgramForm } from "@/components/admin/content/education/past-programs/past-program-form";
import { GalleryManager } from "@/components/admin/content/education/past-programs/gallery-manager";
import {
  addPastProgramImage,
  removePastProgramImage,
  updatePastProgram,
} from "../actions";

export default async function EditPastProgramPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const data = getContentData();
  const item = await data.education.pastPrograms.get(id);
  if (!item) notFound();

  const images = await data.education.pastProgramImages.listByProgram(id);

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/past-programs"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          지난 프로그램
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          지난 프로그램 수정
        </h1>
      </div>
      <PastProgramForm initial={item} onSave={updatePastProgram.bind(null, id)} />

      {/* 갤러리는 부모 행이 있어야 붙일 수 있어 추가 화면에는 없고 수정 화면에만 있다. */}
      <GalleryManager
        programId={id}
        images={images}
        onAdd={addPastProgramImage}
        onRemove={async (imageId: string) => {
          "use server";
          await removePastProgramImage(imageId, id);
        }}
      />
    </div>
  );
}
