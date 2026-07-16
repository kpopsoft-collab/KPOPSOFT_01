import Link from "next/link";

import { getBillingDashboard } from "@/lib/billing/admin-data";
import { getBillingOperationsSnapshot } from "@/lib/billing/operations";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function BillingDashboardPage() {
  await requireBillingPageView();
  const [dashboard, operations] = await Promise.all([
    getBillingDashboard(),
    getBillingOperationsSnapshot(),
  ]);
  const cards = [
    ["승인 대기 초안", operations.draftApprovals, "/admin/billing/invoices?status=DRAFT"],
    ["결제 대기", dashboard.openInvoices, "/admin/billing/invoices?status=OPEN"],
    ["연체 청구", operations.overdueInvoices, "/admin/billing/invoices?status=OVERDUE"],
    ["이메일 실패", operations.deliveryFailures, "/admin/billing/invoices"],
    ["이메일 대기", dashboard.pendingDeliveries, "/admin/billing/invoices"],
    ["30일 생성 실패", dashboard.generatorFailures30d, "/admin/billing/contracts"],
    ["결제 확인 중", operations.confirmingRecent, "/admin/billing/payments"],
    ["확인 중 15분 초과", operations.confirmingStale, "/admin/billing/payments"],
    ["웹훅 재처리", operations.webhookRetries, "/admin/billing/payments"],
    ["환불 처리 중", operations.processingRefunds, "/admin/billing/payments"],
    ["환불 실패", operations.failedRefunds, "/admin/billing/payments"],
  ] as const;

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header>
        <p className="text-xs font-bold uppercase tracking-[0.18em] text-brand-blue">KPOPSOFT Billing Hub</p>
        <h1 className="mt-2 text-3xl font-extrabold tracking-tight">결제·계약 운영</h1>
        <p className="mt-2 text-sm text-ink/55">승인 전 초안, 연체, 이메일 실패와 자동 생성 오류를 한 곳에서 확인합니다.</p>
      </header>
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {cards.map(([label, value, href]) => (
          <Link key={label} href={href} className="rounded-2xl border border-border bg-card p-5 transition hover:border-brand-blue/40">
            <p className="text-sm font-semibold text-ink/55">{label}</p>
            <p className="mt-3 text-3xl font-extrabold">{value.toLocaleString()}</p>
          </Link>
        ))}
      </div>
      <p className="rounded-2xl border border-border bg-card px-5 py-4 text-sm text-ink/60">
        마지막 자동 청구 실행: {operations.lastBillingRunAt ? new Date(operations.lastBillingRunAt).toLocaleString("ko-KR", { timeZone: "Asia/Seoul" }) : "실행 이력 없음"}
      </p>
      <div className="flex flex-wrap gap-3">
        <Link href="/admin/billing/customers/new" className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white">고객사 등록</Link>
        <Link href="/admin/billing/contracts?new=1" className="rounded-full border border-ink/15 px-5 py-2.5 font-semibold">계약 초안 만들기</Link>
      </div>
    </div>
  );
}
