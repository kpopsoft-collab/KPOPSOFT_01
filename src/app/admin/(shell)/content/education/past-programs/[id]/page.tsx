import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
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
    <ContentFormShell
      backHref="/admin/content/education/past-programs"
      backLabel="지난 프로그램"
      title="지난 프로그램 수정"
    >
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
    </ContentFormShell>
  );
}
