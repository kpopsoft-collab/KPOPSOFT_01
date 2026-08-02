import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { TierForm } from "@/components/admin/content/education/club-tiers/tier-form";
import { createTier } from "../actions";

export default function NewTierPage() {
  return (
    <ContentFormShell
      backHref="/admin/content/education/club-tiers"
      backLabel="클럽 참여 유형"
      title="클럽 참여 유형 추가"
    >
      <TierForm onSave={createTier} />
    </ContentFormShell>
  );
}
