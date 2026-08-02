import { notFound } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { ContentFormShell } from "@/components/admin/content/content-form-shell";
import { TierForm } from "@/components/admin/content/education/club-tiers/tier-form";
import { updateTier } from "../actions";

export default async function EditTierPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.clubTiers.get(id);
  if (!item) notFound();

  return (
    <ContentFormShell
      backHref="/admin/content/education/club-tiers"
      backLabel="클럽 참여 유형"
      title="클럽 참여 유형 수정"
    >
      <TierForm initial={item} onSave={updateTier.bind(null, id)} />
    </ContentFormShell>
  );
}
