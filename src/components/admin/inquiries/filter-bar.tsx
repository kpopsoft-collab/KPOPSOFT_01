"use client";

/**
 * Filter bar for the inquiry list (docs/어드민기획.md §6 — 상태/유형/검색).
 * Uncontrolled GET form so filters live entirely in the URL (no client state,
 * shareable/bookmarkable, server does the filtering). Status/type auto-submit
 * on change; the search field submits on Enter or via the button.
 */

import Link from "next/link";
import { useRef } from "react";

import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { INQUIRY_STATUSES, inquiryStatusLabel } from "@/lib/admin/types";
import { inquiryOptions } from "@/lib/site";

const fieldClass =
  "h-11 min-h-11 rounded-xl border border-ink/15 bg-ivory px-3 text-base font-medium text-ink outline-none transition-colors focus-visible:border-brand-blue focus-visible:ring-3 focus-visible:ring-brand-blue/30";

// Match the search input's height/radius/fill so the row reads as one control set.
const triggerClass = "h-11 min-w-40 rounded-xl bg-ivory";

// value → label maps so the trigger resolves the selected label while closed
// (base-ui reads these from Root.items instead of the mounted popup items).
const statusItems: Record<string, string> = {
  all: "전체",
  ...Object.fromEntries(INQUIRY_STATUSES.map((s) => [s, inquiryStatusLabel[s]])),
};
const typeItems: Record<string, string> = {
  all: "전체",
  ...Object.fromEntries(inquiryOptions.map((o) => [o.type, o.type])),
};

export function InquiryFilterBar({
  status,
  type,
  query,
}: {
  status: string;
  type: string;
  query: string;
}) {
  const formRef = useRef<HTMLFormElement>(null);

  return (
    <form
      ref={formRef}
      action="/admin/inquiries"
      method="get"
      className="flex flex-wrap items-end gap-3"
    >
      <div className="flex flex-col gap-1.5 text-sm font-semibold text-ink/70">
        상태
        <Select
          name="status"
          items={statusItems}
          defaultValue={status}
          onValueChange={() => formRef.current?.requestSubmit()}
        >
          <SelectTrigger className={triggerClass} aria-label="상태 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {INQUIRY_STATUSES.map((s) => (
              <SelectItem key={s} value={s}>
                {inquiryStatusLabel[s]}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <div className="flex flex-col gap-1.5 text-sm font-semibold text-ink/70">
        유형
        <Select
          name="type"
          items={typeItems}
          defaultValue={type}
          onValueChange={() => formRef.current?.requestSubmit()}
        >
          <SelectTrigger className={triggerClass} aria-label="유형 필터">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">전체</SelectItem>
            {inquiryOptions.map((o) => (
              <SelectItem key={o.type} value={o.type}>
                {o.type}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      <label className="flex min-w-52 flex-1 flex-col gap-1.5 text-sm font-semibold text-ink/70">
        검색
        <input
          type="search"
          name="query"
          defaultValue={query}
          placeholder="이름·회사·문의 내용 검색"
          className={`${fieldClass} placeholder:text-ink/35 placeholder:font-normal`}
        />
      </label>

      <div className="flex gap-2">
        <Button
          type="submit"
          className="h-11 rounded-full bg-brand-blue px-5 text-sm font-bold text-white hover:bg-brand-blue/90"
        >
          검색
        </Button>
        <Link
          href="/admin/inquiries"
          className="inline-flex h-11 items-center rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/70 transition-colors hover:bg-ink/5"
        >
          초기화
        </Link>
      </div>
    </form>
  );
}
