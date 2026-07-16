import Link from "next/link";

import { requireBillingPageView } from "@/lib/billing/page-auth";
import { listBillingPaymentOperations } from "@/lib/billing/payments/repository";

type QueueView = "all" | "confirming" | "webhooks" | "refunds" | "completed";

function isView(value: string | undefined): value is QueueView {
  return ["all", "confirming", "webhooks", "refunds", "completed"].includes(value ?? "");
}

export default async function BillingPaymentsPage({
  searchParams,
}: {
  searchParams: Promise<{ view?: string }>;
}) {
  await requireBillingPageView();
  const { view: rawView } = await searchParams;
  const view: QueueView = isView(rawView) ? rawView : "all";
  const data = await listBillingPaymentOperations();
  const show = (target: Exclude<QueueView, "all">) => view === "all" || view === target;

  const filters: Array<[QueueView, string, number]> = [
    ["all", "전체", data.attempts.length + data.webhooks.length + data.refunds.length + data.payments.length],
    ["confirming", "승인 확인중", data.attempts.length],
    ["webhooks", "웹훅 오류", data.webhooks.length],
    ["refunds", "환불 처리", data.refunds.length],
    ["completed", "결제 완료", data.payments.length],
  ];

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header>
        <p className="text-xs font-bold text-brand-blue">BILLING OPERATIONS</p>
        <h1 className="mt-1 text-2xl font-extrabold">결제 운영</h1>
        <p className="mt-2 text-sm text-ink/55">불명확한 승인, 웹훅, 환불과 완료 결제를 한곳에서 확인합니다.</p>
      </header>
      <nav className="flex flex-wrap gap-2" aria-label="결제 운영 필터">
        {filters.map(([key, label, count]) => <Link key={key} href={`/admin/billing/payments?view=${key}`} className={`rounded-full px-4 py-2 text-sm font-bold ${view === key ? "bg-brand-blue text-white" : "border border-ink/15 bg-white text-ink"}`}>{label} {count}</Link>)}
      </nav>

      {show("confirming") ? <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">승인 결과 확인중</h2>{data.attempts.length === 0 ? <p className="text-sm text-ink/55">대기 건이 없습니다.</p> : data.attempts.map((attempt) => <div key={attempt.id} className="rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{attempt.invoiceNumber} · {attempt.amount.toLocaleString()}원</p><p className="mt-1 text-ink/55">{attempt.orderId} · {attempt.status} · {attempt.updatedAt.toLocaleString("ko-KR")}</p></div>)}</section> : null}

      {show("webhooks") ? <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">웹훅 재처리·거절</h2>{data.webhooks.length === 0 ? <p className="text-sm text-ink/55">오류 건이 없습니다.</p> : data.webhooks.map((webhook) => <div key={webhook.id} className="rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{webhook.eventType} · {webhook.status}</p><p className="mt-1 text-ink/55">전송 {webhook.transmissionId} · 시도 {webhook.attemptCount}회 · {webhook.lastErrorCode ?? "오류코드 없음"}</p></div>)}</section> : null}

      {show("refunds") ? <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">환불 처리</h2>{data.refunds.length === 0 ? <p className="text-sm text-ink/55">처리 건이 없습니다.</p> : data.refunds.map((refund) => <Link key={refund.id} href={`/admin/billing/payments/${refund.paymentId}`} className="block rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{refund.customerName} · {refund.invoiceNumber} · {refund.amount.toLocaleString()}원</p><p className="mt-1 text-ink/55">{refund.status} · {refund.providerCode ?? "공급자 코드 없음"} · {refund.reason}</p></Link>)}</section> : null}

      {show("completed") ? <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">완료 결제</h2>{data.payments.length === 0 ? <p className="text-sm text-ink/55">완료 결제가 없습니다.</p> : data.payments.map((payment) => <Link key={payment.id} href={`/admin/billing/payments/${payment.id}`} className="block rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{payment.customerName} · {payment.invoiceNumber}</p><p className="mt-1 text-ink/55">{payment.method} · {payment.amount.toLocaleString()}원 · 환불 {payment.refundedAmount.toLocaleString()}원 · {payment.approvedAt.toLocaleString("ko-KR")}</p></Link>)}</section> : null}
    </div>
  );
}
