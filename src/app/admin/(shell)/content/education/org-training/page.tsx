import { getContentData } from "@/lib/admin/content-data";
import { OrgTrainingForm } from "@/components/admin/content/education/org-training/org-training-form";
import { saveOrgTraining } from "./actions";

export default async function OrgTrainingPage() {
  const item = await getContentData().education.orgTraining.get();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          조직·기업 맞춤 교육
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          프로그램 카드와 교육 페이지에 쓰이는 소개 문구입니다. 상품이 하나뿐이라
          목록 없이 이 화면에서 바로 수정합니다.
        </p>
      </div>
      <OrgTrainingForm initial={item} onSave={saveOrgTraining} />
    </div>
  );
}
