import { getContentData } from "@/lib/admin/content-data";
import { EducationSettingsForm } from "@/components/admin/content/education/settings/settings-form";
import { updateEducationSettings } from "./actions";

export default async function EducationPageSettingsPage() {
  const settings = await getContentData().education.settings.get();

  return (
    <div className="mx-auto flex max-w-3xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">Education 페이지 설정</h1>
        <p className="mt-2 text-sm text-ink/55">
          Hero 문구·이미지·CTA와 VIBEDAYS 소개, 섹션별 공개 여부·노출 순서를 관리합니다.
        </p>
      </div>
      <EducationSettingsForm initial={settings} onSave={updateEducationSettings} />
    </div>
  );
}
