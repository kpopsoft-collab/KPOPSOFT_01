"use client";

/**
 * Status changer for the inquiry detail page (docs/어드민기획.md §6 — "상태 드롭다운
 * (즉시 저장)"). Plain native <select> styled to the field tokens: base-ui's Select
 * needs generic wiring for form-submit semantics we don't need here, so a native
 * element keeps this small and fully keyboard/screen-reader accessible.
 */

import { useState, useTransition } from "react";

import { updateInquiryStatus } from "@/app/admin/(shell)/inquiries/actions";
import {
  INQUIRY_STATUSES,
  inquiryStatusLabel,
  type InquiryStatus,
} from "@/lib/admin/types";

export function StatusSelect({
  id,
  status,
}: {
  id: string;
  status: InquiryStatus;
}) {
  const [value, setValue] = useState(status);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <div className="flex flex-col gap-2">
      <label htmlFor={`inquiry-status-${id}`} className="text-sm font-semibold text-ink/70">
        상태
      </label>
      <select
        id={`inquiry-status-${id}`}
        value={value}
        disabled={pending}
        onChange={(event) => {
          const next = event.target.value as InquiryStatus;
          setValue(next);
          setSaved(false);
          startTransition(async () => {
            await updateInquiryStatus(id, next);
            setSaved(true);
          });
        }}
        className="h-11 min-h-11 w-full rounded-xl border border-ink/15 bg-ivory px-3 text-base font-semibold text-ink outline-none transition-colors focus-visible:border-brand-blue focus-visible:ring-3 focus-visible:ring-brand-blue/30 disabled:opacity-60"
      >
        {INQUIRY_STATUSES.map((s) => (
          <option key={s} value={s}>
            {inquiryStatusLabel[s]}
          </option>
        ))}
      </select>
      <p role="status" aria-live="polite" className="min-h-4 text-xs font-medium text-muted-foreground">
        {pending ? "저장 중…" : saved ? "저장됨" : ""}
      </p>
    </div>
  );
}
