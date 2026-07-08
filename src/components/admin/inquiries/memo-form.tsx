"use client";

/**
 * Internal memo editor for the inquiry detail page (docs/어드민기획.md §6 —
 * "내부 메모 textarea(저장)"). Explicit save button rather than autosave so the
 * admin gets a clear confirmation moment.
 */

import { useState, useTransition } from "react";

import { updateInquiryMemo } from "@/app/admin/(shell)/inquiries/actions";
import { Button } from "@/components/ui/button";

export function MemoForm({ id, memo }: { id: string; memo: string }) {
  const [value, setValue] = useState(memo);
  const [pending, startTransition] = useTransition();
  const [saved, setSaved] = useState(false);

  return (
    <form
      onSubmit={(event) => {
        event.preventDefault();
        setSaved(false);
        startTransition(async () => {
          await updateInquiryMemo(id, value);
          setSaved(true);
        });
      }}
      className="flex flex-col gap-3"
    >
      <label htmlFor={`inquiry-memo-${id}`} className="text-sm font-semibold text-ink/70">
        내부 메모
      </label>
      <textarea
        id={`inquiry-memo-${id}`}
        value={value}
        onChange={(event) => {
          setValue(event.target.value);
          setSaved(false);
        }}
        rows={6}
        placeholder="응대 이력, 다음 액션 등을 기록하세요."
        className="min-h-32 resize-y rounded-xl border border-ink/15 bg-ivory px-3 py-2.5 text-base text-ink outline-none transition-colors placeholder:text-ink/35 focus-visible:border-brand-blue focus-visible:ring-3 focus-visible:ring-brand-blue/30"
      />
      <div className="flex items-center gap-3">
        <Button
          type="submit"
          disabled={pending}
          className="h-11 rounded-full bg-brand-blue px-5 text-sm font-bold text-white hover:bg-brand-blue/90 disabled:opacity-60"
        >
          {pending ? "저장 중…" : "메모 저장"}
        </Button>
        <p role="status" aria-live="polite" className="min-h-4 text-xs font-medium text-muted-foreground">
          {saved ? "저장됨" : ""}
        </p>
      </div>
    </form>
  );
}
