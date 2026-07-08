import Link from "next/link";

import { InquiryFilterBar } from "@/components/admin/inquiries/filter-bar";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { getAdminData } from "@/lib/admin/data";
import {
  INQUIRY_STATUSES,
  inquiryStatusAccent,
  inquiryStatusLabel,
  type InquiryStatus,
} from "@/lib/admin/types";
import { cn } from "@/lib/utils";

/**
 * Inquiry list (docs/어드민기획.md §6). Server Component: filters live in the
 * URL and are applied server-side via `listInquiries(filter)` — no client
 * fetch/loading state needed. Each row is a stretched-link row (single <a>
 * absolutely positioned over the row) so the whole row is one accessible,
 * keyboard-reachable click target instead of nested interactive elements.
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

function isInquiryStatus(value: string | undefined): value is InquiryStatus {
  return (
    value !== undefined &&
    (INQUIRY_STATUSES as readonly string[]).includes(value)
  );
}

type InquiriesSearchParams = {
  status?: string;
  type?: string;
  query?: string;
};

export default async function InquiriesListPage({
  searchParams,
}: {
  searchParams: Promise<InquiriesSearchParams>;
}) {
  const sp = await searchParams;
  const status = isInquiryStatus(sp.status) ? sp.status : undefined;
  const type = sp.type && sp.type !== "all" ? sp.type : undefined;
  const query = sp.query?.trim() || undefined;

  const inquiries = await getAdminData().listInquiries({ status, type, query });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">문의</h1>
        <p className="mt-1 text-sm text-ink/55">
          접수된 문의를 확인하고 응대 상태를 관리합니다. 행을 클릭하면 상세로 이동합니다.
        </p>
      </header>

      <InquiryFilterBar
        status={sp.status ?? "all"}
        type={sp.type ?? "all"}
        query={sp.query ?? ""}
      />

      <div className="rounded-2xl border border-border bg-card">
        {inquiries.length === 0 ? (
          <div className="flex flex-col items-center gap-1.5 px-6 py-16 text-center">
            <p className="text-base font-semibold text-ink">문의가 없습니다.</p>
            <p className="text-sm text-muted-foreground">
              조건에 맞는 문의가 없어요. 필터를 조정해 보세요.
            </p>
          </div>
        ) : (
          <Table>
            <TableHeader>
              <TableRow className="hover:bg-transparent">
                <TableHead scope="col">유형</TableHead>
                <TableHead scope="col">세부 유형</TableHead>
                <TableHead scope="col">이름 · 회사</TableHead>
                <TableHead scope="col">연락처</TableHead>
                <TableHead scope="col">상태</TableHead>
                <TableHead scope="col">접수일</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {inquiries.map((inquiry) => (
                <TableRow key={inquiry.id} className="relative">
                  <TableCell className="font-semibold text-ink">
                    <Link
                      href={`/admin/inquiries/${inquiry.id}`}
                      className="absolute inset-0 z-10"
                      aria-label={`${inquiry.sender}의 ${inquiry.type} 문의 상세 보기`}
                    />
                    {inquiry.type}
                  </TableCell>
                  <TableCell className="text-ink/75">{inquiry.subtype}</TableCell>
                  <TableCell className="text-ink/75">{inquiry.sender}</TableCell>
                  <TableCell className="text-ink/75">{inquiry.contact}</TableCell>
                  <TableCell>
                    <span
                      className={cn(
                        "inline-flex h-6 items-center rounded-full px-3 text-xs font-bold",
                        inquiryStatusAccent[inquiry.status],
                      )}
                    >
                      {inquiryStatusLabel[inquiry.status]}
                    </span>
                  </TableCell>
                  <TableCell className="whitespace-nowrap text-ink/60">
                    {formatKst(inquiry.createdAt)}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </div>
  );
}
