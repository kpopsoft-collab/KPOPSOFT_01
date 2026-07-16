import Link from "next/link";
import { Plus } from "lucide-react";

import { getContentData } from "@/lib/admin/content-data";
import {
  DeleteButton,
  EditLink,
  PublishToggle,
} from "@/components/admin/content/row-actions";
import { deleteVibedaysRole, setVibedaysRolePublished } from "./actions";

export default async function VibedaysRolesListPage() {
  const items = await getContentData().education.vibedaysRoles.list();

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <div className="flex items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">VIBEDAYS CLUB</h1>
          <p className="mt-2 text-sm text-ink/55">
            캐릭터 역할(NEW VIBER · VIBE MAKER · VIBE SHARER)을 관리합니다.
          </p>
        </div>
        <Link
          href="/admin/content/education/vibedays/new"
          className="inline-flex min-h-11 items-center gap-2 rounded-full bg-brand-blue px-5 font-semibold text-white transition-colors hover:bg-brand-navy"
        >
          <Plus className="size-4" aria-hidden />
          역할 추가
        </Link>
      </div>

      {items.length === 0 ? (
        <p className="rounded-2xl border border-dashed border-ink/15 p-10 text-center text-sm text-ink/50">
          등록된 역할이 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {items.map((r) => (
            <li
              key={r.id}
              className="flex items-center gap-4 rounded-2xl border border-border bg-card p-4"
            >
              <div className="size-14 shrink-0 overflow-hidden rounded-xl bg-ivory/60">
                {r.characterImageUrl ? (
                  // eslint-disable-next-line @next/next/no-img-element
                  <img
                    src={r.characterImageUrl}
                    alt={r.roleName}
                    className="size-full object-cover"
                  />
                ) : (
                  <span className="flex size-full items-center justify-center text-lg font-extrabold text-ink/30">
                    {r.roleName.slice(0, 1)}
                  </span>
                )}
              </div>

              <div className="min-w-0 flex-1">
                <p className="truncate font-bold text-ink">{r.roleName}</p>
                <p className="truncate text-sm text-ink/55">{r.tagline}</p>
              </div>

              <PublishToggle
                id={r.id}
                isPublished={r.isPublished}
                action={setVibedaysRolePublished}
              />
              <EditLink href={`/admin/content/education/vibedays/${r.id}`} />
              <DeleteButton id={r.id} action={deleteVibedaysRole} label={`역할 '${r.roleName}'`} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}
