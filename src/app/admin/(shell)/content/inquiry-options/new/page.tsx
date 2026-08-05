import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { TypeForm } from "@/components/admin/content/inquiry-options/type-form";
import { createType } from "../actions";

export default function NewInquiryTypePage() {
  return (
    <ContentFormShell
      backHref="/admin/content/inquiry-options"
      backLabel="문의 옵션"
      title="유형 추가"
      description="유형을 먼저 만든 뒤, 세부 유형은 저장 후 관리 화면에서 추가합니다."
      className="max-w-xl"
    >
      <TypeForm onSave={async (input) => {
        "use server";
        await createType({ label: input.label });
      }} />
    </ContentFormShell>
  );
}
