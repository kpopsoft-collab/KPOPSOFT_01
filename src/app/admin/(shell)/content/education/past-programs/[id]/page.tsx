import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { PastProgramForm } from "@/components/admin/content/education/past-programs/past-program-form";
import { GalleryManager } from "@/components/admin/content/education/past-programs/gallery-manager";
import {
  addPastProgramImage,
  createPastProgram,
  removePastProgramImage,
  updatePastProgram,
} from "../actions";

/** 추가·수정 겸용 라우트 (`id === "new"`가 추가). 제약은 docs/06-admin/06 §3. */
export default async function PastProgramFormPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const isNew = id === "new";
  const data = getContentData();

  const item = (isNew ? undefined : await data.education.pastPrograms.get(id)) ?? undefined;
  if (!isNew && !item) notFound();

  // 갤러리는 부모 행이 있어야 붙일 수 있어 추가 화면에는 없다.
  const images = isNew ? [] : await data.education.pastProgramImages.listByProgram(id);

  return (
    <ContentFormShell
      backHref="/admin/content/education/past-programs"
      backLabel="지난 프로그램"
      title={isNew ? "지난 프로그램 추가" : "지난 프로그램 수정"}
    >
      <PastProgramForm
        initial={item}
        onSave={isNew ? createPastProgram : updatePastProgram.bind(null, id)}
      />

      {!isNew && (
        <GalleryManager
          programId={id}
          images={images}
          onAdd={addPastProgramImage}
          onRemove={async (imageId: string) => {
            "use server";
            await removePastProgramImage(imageId, id);
          }}
        />
      )}
    </ContentFormShell>
  );
}
