import Link from "next/link";
import { ArrowLeft } from "lucide-react";
import { notFound } from "next/navigation";

import { MemoForm } from "@/components/admin/inquiries/memo-form";
import { StatusSelect } from "@/components/admin/inquiries/status-select";
import { getAdminData } from "@/lib/admin/data";
import { inquiryStatusAccent, inquiryStatusLabel } from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/**
 * Inquiry detail (docs/어드민기획.md §6). Server Component fetches the record;
 * status change + memo are delegated to small client components that call the
 * Server Actions in `../actions.ts`.
 */

const kstFormatter = new Intl.DateTimeFormat("ko-KR", {
  timeZone: "Asia/Seoul",
  year: "numeric",
  month: "2-digit",
  day: "2-digit",
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function formatKst(iso: string): string {
  const parts = kstFormatter.formatToParts(new Date(iso));
  const get = (type: Intl.DateTimeFormatPartTypes) =>
    parts.find((p) => p.type === type)?.value ?? "";
  return `${get("year")}.${get("month")}.${get("day")} ${get("hour")}:${get("minute")}`;
}

/** Loose heuristic — the contact field is free text (email or phone). */
function isEmail(contact: string): boolean {
  return /\S+@\S+\.\S+/.test(contact);
}

export default async function InquiryDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const inquiry = await getAdminData().getInquiry(id);
  if (!inquiry) notFound();

  return (
    <div className="mx-auto flex max-w-4xl flex-col gap-6">
      <div className="flex flex-col gap-3">
        <Link
          href="/admin/inquiries"
          className="inline-flex w-fit min-h-11 items-center gap-1.5 text-sm font-semibold text-ink/55 transition-colors hover:text-ink"
        >
          <ArrowLeft className="size-4" aria-hidden />
          문의 목록
        </Link>
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-2xl font-extrabold tracking-tight text-ink">
            {inquiry.type} · {inquiry.subtype}
          </h1>
          <span
            className={cn(
              "inline-flex h-6 items-center rounded-full px-3 text-xs font-bold",
              inquiryStatusAccent[inquiry.status],
            )}
          >
            {inquiryStatusLabel[inquiry.status]}
          </span>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr] lg:items-start">
        <section className="flex flex-col gap-6 rounded-2xl border border-border bg-card p-6">
          <dl className="grid gap-5 sm:grid-cols-2">
            <div>
              <dt className="text-eyebrow text-muted-foreground">유형</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{inquiry.type}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-muted-foreground">세부 유형</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{inquiry.subtype}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-muted-foreground">이름 · 회사</dt>
              <dd className="mt-1 text-base font-semibold text-ink">{inquiry.sender}</dd>
            </div>
            <div>
              <dt className="text-eyebrow text-muted-foreground">연락처</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {isEmail(inquiry.contact) ? (
                  <a
                    href={`mailto:${inquiry.contact}`}
                    className="text-brand-blue underline-offset-4 hover:underline"
                  >
                    {inquiry.contact}
                  </a>
                ) : (
                  inquiry.contact
                )}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-muted-foreground">접수일시</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {formatKst(inquiry.createdAt)}
              </dd>
            </div>
            <div>
              <dt className="text-eyebrow text-muted-foreground">수정일시</dt>
              <dd className="mt-1 text-base font-semibold text-ink">
                {formatKst(inquiry.updatedAt)}
              </dd>
            </div>
          </dl>

          <div>
            <p className="text-eyebrow text-muted-foreground">문의 내용</p>
            <p className="mt-2 whitespace-pre-wrap text-base leading-relaxed text-ink/85">
              {inquiry.message}
            </p>
          </div>
        </section>

        <aside className="flex flex-col gap-6">
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold tracking-wide text-ink">상태 관리</h2>
            <StatusSelect id={inquiry.id} status={inquiry.status} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold tracking-wide text-ink">내부 메모</h2>
            <MemoForm id={inquiry.id} memo={inquiry.memo} />
          </div>
        </aside>
      </div>
    </div>
  );
}
