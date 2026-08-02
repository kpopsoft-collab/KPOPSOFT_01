import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowLeft } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import { PillarForm } from "@/components/admin/content/pillars/pillar-form";
import { updatePillar } from "../actions";

export default async function EditPillarPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = await getContentData().pillars.get(id);
  if (!item) notFound();

  return (
    <div className="mx-auto flex max-w-2xl flex-col gap-6">
      <div>
        <Link
          href="/admin/content/pillars"
          className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          핵심 비즈니스
        </Link>
        <h1 className="mt-3 text-2xl font-extrabold tracking-tight text-ink">
          {item.title} 카드 수정
        </h1>
      </div>
      <PillarForm initial={item} onSave={updatePillar.bind(null, id)} />
    </div>
  );
}
