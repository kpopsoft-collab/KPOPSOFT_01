import Link from "next/link";
import { notFound } from "next/navigation";

import { RefundForm } from "@/components/admin/billing/refund-form";
import { ProviderRequeryButton } from "@/components/admin/billing/provider-requery-button";
import { requireBillingPageView } from "@/lib/billing/page-auth";
import { getBillingPaymentForAdmin } from "@/lib/billing/payments/repository";

export default async function BillingPaymentDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBillingPageView();
  const { id } = await params;
  const payment = await getBillingPaymentForAdmin(id);
  if (!payment) notFound();
  const refundable =
    ["CARD", "EASY_PAY"].includes(payment.method) &&
    payment.refundedAmount < payment.amount;

  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header>
        <Link href="/admin/billing/payments" className="text-sm font-bold text-brand-blue">← 결제 운영</Link>
        <p className="mt-5 text-xs font-bold text-brand-blue">{payment.customerName} · {payment.siteName}</p>
        <h1 className="mt-1 text-2xl font-extrabold">{payment.invoiceNumber}</h1>
        <p className="mt-1 text-sm text-ink/55">{payment.method} · {payment.approvedAt.toLocaleString("ko-KR")}</p>
      </header>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-3">
        <div><p className="text-xs font-bold text-ink/45">결제금액</p><p className="mt-1 text-xl font-extrabold">{payment.amount.toLocaleString()}원</p></div>
        <div><p className="text-xs font-bold text-ink/45">환불완료</p><p className="mt-1 text-xl font-extrabold">{payment.refundedAmount.toLocaleString()}원</p></div>
        <div><p className="text-xs font-bold text-ink/45">청구상태</p><p className="mt-1 text-xl font-extrabold">{payment.invoiceStatus}</p></div>
      </section>
      {["CARD", "EASY_PAY"].includes(payment.method) ? <ProviderRequeryButton paymentId={payment.id} /> : null}
      {refundable ? <RefundForm payment={{ id: payment.id, customerName: payment.customerName, invoiceNumber: payment.invoiceNumber, amount: payment.amount, refundedAmount: payment.refundedAmount }} /> : null}
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">환불 이력</h2>{payment.refunds.length === 0 ? <p className="text-sm text-ink/55">환불 이력이 없습니다.</p> : payment.refunds.map((refund) => <div key={refund.id} className="rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{refund.amount.toLocaleString()}원 · {refund.status}</p><p className="mt-1 text-ink/55">{refund.reason}</p></div>)}</section>
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">이벤트 타임라인</h2>{payment.events.map((event) => <div key={event.id} className="rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{event.eventType}</p><p className="mt-1 text-ink/55">{event.source} · {event.fromStatus ?? "-"} → {event.toStatus} · {event.occurredAt.toLocaleString("ko-KR")}</p></div>)}</section>
    </div>
  );
}
