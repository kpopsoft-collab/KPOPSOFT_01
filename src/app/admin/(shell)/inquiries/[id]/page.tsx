import Link from "next/link";
import { ArrowLeft, ExternalLink, RefreshCw } from "lucide-react";
import { notFound } from "next/navigation";

import { MemoForm } from "@/components/admin/inquiries/memo-form";
import { StatusSelect } from "@/components/admin/inquiries/status-select";
import { getAdminData } from "@/lib/admin/data";
import { inquiryStatusAccent, inquiryStatusLabel } from "@/lib/admin/types";
import { cn } from "@/lib/utils";
import {
  retryInquiryEmail,
  retryInquiryLinear,
} from "../delivery-actions";

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

const deliveryErrorLabel: Record<string, string> = {
  configuration_error: "연동 설정을 확인해 주세요.",
  unauthorized: "연동 권한을 확인해 주세요.",
  throttled: "요청이 많아 잠시 후 재시도가 필요합니다.",
  queued: "메일이 대기열에 있어 재확인이 필요합니다.",
  permanent_bounce: "수신 주소로 메일을 전달할 수 없습니다.",
  provider_error: "외부 서비스 처리 중 오류가 발생했습니다.",
};

function DeliveryRow({
  label,
  status,
  error,
  retryAction,
  externalUrl,
}: {
  label: string;
  status: "pending" | "sent" | "created" | "failed";
  error: string | null;
  retryAction: () => Promise<void>;
  externalUrl?: string | null;
}) {
  const success = status === "sent" || status === "created";
  const statusLabel = success
    ? "완료"
    : status === "failed"
      ? "실패"
      : "대기";
  return (
    <div className="rounded-2xl border border-ink/10 p-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <p className="text-sm font-bold text-ink">{label}</p>
        <span
          className={cn(
            "rounded-full px-2.5 py-1 text-[11px] font-bold",
            success
              ? "bg-brand-mint/15 text-brand-mint-ink"
              : status === "failed"
                ? "bg-brand-red/10 text-brand-red"
                : "bg-ink/5 text-ink/50",
          )}
        >
          {statusLabel}
        </span>
      </div>
      {error ? (
        <p className="mt-2 text-xs leading-5 text-ink/55">
          {deliveryErrorLabel[error] ?? "재시도가 필요합니다."}
        </p>
      ) : null}
      <div className="mt-3 flex flex-wrap gap-2">
        {status === "failed" ? (
          <form action={retryAction}>
            <button
              type="submit"
              className="inline-flex min-h-10 items-center gap-1.5 rounded-full bg-ink px-4 text-xs font-bold text-white hover:bg-brand-navy"
            >
              <RefreshCw className="size-3.5" aria-hidden />
              다시 시도
            </button>
          </form>
        ) : null}
        {externalUrl ? (
          <a
            href={externalUrl}
            target="_blank"
            rel="noreferrer"
            className="inline-flex min-h-10 items-center gap-1.5 rounded-full border border-ink/15 px-4 text-xs font-bold text-ink hover:border-brand-blue hover:text-brand-blue"
          >
            Linear에서 보기
            <ExternalLink className="size-3.5" aria-hidden />
          </a>
        ) : null}
      </div>
    </div>
  );
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
            <h2 className="text-sm font-bold tracking-wide text-ink">내부 메모</h2>
            <MemoForm id={inquiry.id} memo={inquiry.memo} />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold tracking-wide text-ink">전달 상태</h2>
            <DeliveryRow
              label="이메일 알림"
              status={inquiry.emailStatus}
              error={inquiry.emailError}
              retryAction={retryInquiryEmail.bind(null, inquiry.id)}
            />
            <DeliveryRow
              label="Linear 이슈"
              status={inquiry.linearStatus}
              error={inquiry.linearError}
              retryAction={retryInquiryLinear.bind(null, inquiry.id)}
              externalUrl={inquiry.linearIssueUrl}
            />
          </div>
          <div className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-6">
            <h2 className="text-sm font-bold tracking-wide text-ink">상태 관리</h2>
            <StatusSelect id={inquiry.id} status={inquiry.status} />
          </div>
        </aside>
      </div>
    </div>
  );
}
