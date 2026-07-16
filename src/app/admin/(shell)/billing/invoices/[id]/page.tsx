import Link from "next/link";
import { notFound } from "next/navigation";

import { InvoiceReviewForm } from "@/components/admin/billing/invoice-review-form";
import { BankConfirmationForm } from "@/components/admin/billing/bank-confirmation-form";
import { getBillingInvoiceForAdmin } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";
import { getBankTransferInstructions } from "@/lib/billing/payments/bank";

export default async function BillingInvoiceDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBillingPageView();
  const { id } = await params;
  const invoice = await getBillingInvoiceForAdmin(id);
  if (!invoice) notFound();
  const bankInstructions = getBankTransferInstructions(invoice);

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><p className="text-xs font-bold text-brand-blue">{invoice.customerName} · {invoice.siteName}</p><h1 className="mt-1 text-2xl font-extrabold">{invoice.number}</h1><p className="mt-1 text-sm text-ink/55">{invoice.status} · {invoice.periodStart} ~ {invoice.periodEnd}</p></div><Link href={`/admin/billing/contracts/${invoice.contractId}`} className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold">계약 보기</Link></header>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2 lg:grid-cols-4"><div><p className="text-xs font-bold text-ink/45">공급가액</p><p className="mt-1 text-xl font-extrabold">{invoice.supplyAmount.toLocaleString()}원</p></div><div><p className="text-xs font-bold text-ink/45">부가세</p><p className="mt-1 text-xl font-extrabold">{invoice.vatAmount.toLocaleString()}원</p></div><div><p className="text-xs font-bold text-ink/45">합계</p><p className="mt-1 text-xl font-extrabold text-brand-blue">{invoice.totalAmount.toLocaleString()}원</p></div><div><p className="text-xs font-bold text-ink/45">납부기한</p><p className="mt-1 text-xl font-extrabold">{invoice.dueDate}</p></div></section>
      {bankInstructions && invoice.payments.length === 0 ? <BankConfirmationForm invoice={{ id: invoice.id, number: invoice.number, customerName: invoice.customerName, expectedAmount: bankInstructions.amount }} /> : null}
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">결제 이력</h2>
        {invoice.payments.length === 0 ? <p className="text-sm text-ink/55">아직 확인된 결제가 없습니다.</p> : invoice.payments.map((payment) => <div key={payment.id} className="rounded-xl bg-ivory p-3 text-sm"><p className="font-bold">{payment.method === "BANK_TRANSFER" ? "무통장 입금" : payment.method} · {payment.amount.toLocaleString()}원</p><p className="mt-1 text-ink/55">승인 {payment.approvedAt.toLocaleString("ko-KR")} {payment.depositorName ? `· 입금자 ${payment.depositorName}` : ""}</p>{payment.evidenceNote ? <p className="mt-1 whitespace-pre-wrap text-ink/55">{payment.evidenceNote}</p> : null}</div>)}
      </section>
      <InvoiceReviewForm invoice={{ id: invoice.id, status: invoice.status, periodStart: invoice.periodStart, periodEnd: invoice.periodEnd, issueDate: invoice.issueDate, dueDate: invoice.dueDate, items: invoice.items.map((item) => ({ productCode: item.productCode, productName: item.productName, description: item.description, quantity: item.quantity, unitSupplyAmount: item.unitSupplyAmount, vatAmount: item.vatAmount })), deliveries: invoice.deliveries.map((delivery) => ({ id: delivery.id, recipient: delivery.recipient, status: delivery.status, attemptCount: delivery.attemptCount, errorCode: delivery.errorCode })) }} />
    </div>
  );
}
