import Link from "next/link";
import { ArrowLeft } from "lucide-react";

import { VibedaysRoleForm } from "@/components/admin/content/education/vibedays/vibedays-form";
import { createVibedaysRole } from "../actions";

export default function NewVibedaysRolePage() {
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
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">역할 추가</h1>
      </div>
      <VibedaysRoleForm onSave={createVibedaysRole} />
    </div>
  );
}
