"use client";

import { useTransition } from "react";
import Link from "next/link";
import { Pencil, Trash2, Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Shared list-row controls for every CMS collection. The server actions are
 * passed in as props (type-specific), so these stay generic and reused.
 */

export function EditLink({ href }: { href: string }) {
  return (
    <Link
      href={href}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue"
      aria-label="편집"
    >
      <Pencil className="size-4" aria-hidden />
    </Link>
  );
}

export function DeleteButton({
  id,
  action,
  label = "이 항목",
}: {
  id: string;
  action: (id: string) => Promise<void>;
  label?: string;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => {
        if (!confirm(`${label}을(를) 삭제할까요? 되돌릴 수 없습니다.`)) return;
        start(() => action(id));
      }}
      className="inline-flex size-9 items-center justify-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
      aria-label="삭제"
    >
      <Trash2 className="size-4" aria-hidden />
    </button>
  );
}

export function PublishToggle({
  id,
  isPublished,
  action,
}: {
  id: string;
  isPublished: boolean;
  action: (id: string, next: boolean) => Promise<void>;
}) {
  const [pending, start] = useTransition();
  return (
    <button
      type="button"
      disabled={pending}
      onClick={() => start(() => action(id, !isPublished))}
      aria-pressed={isPublished}
      className={cn(
        "inline-flex min-h-8 items-center gap-1.5 rounded-full px-3 text-xs font-bold transition-colors disabled:opacity-50",
        isPublished
          ? "bg-brand-mint/20 text-ink"
          : "bg-ink/5 text-ink/45",
      )}
    >
      {isPublished ? (
        <Eye className="size-3.5" aria-hidden />
      ) : (
        <EyeOff className="size-3.5" aria-hidden />
      )}
      {isPublished ? "노출" : "숨김"}
    </button>
  );
}
