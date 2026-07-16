import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { VibedaysRoleForm } from "@/components/admin/content/education/vibedays/vibedays-form";
import { updateVibedaysRole } from "../actions";

export default async function EditVibedaysRolePage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().education.vibedaysRoles.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/education/vibedays"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          VIBEDAYS CLUB
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">역할 수정</h1>
      </div>
      <VibedaysRoleForm initial={item} onSave={updateVibedaysRole.bind(null, id)} />
    </div>
  );
}
