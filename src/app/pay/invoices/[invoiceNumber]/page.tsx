import Link from "next/link";
import { notFound } from "next/navigation";

import { TossPaymentButton } from "@/components/billing/toss-payment-button";
import { getBankTransferInstructions } from "@/lib/billing/payments/bank";
import { tossPublicConfig } from "@/lib/billing/payments/runtime";
import {
  loadPaymentPortal,
  requirePaymentSession,
} from "@/lib/billing/widget/payment-session";

export const dynamic = "force-dynamic";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export default async function PayInvoicePage({
  params,
}: {
  params: Promise<{ invoiceNumber: string }>;
}) {
  const session = await requirePaymentSession();
  const data = await loadPaymentPortal(session);
  const { invoiceNumber } = await params;
  const invoice = data.invoices.find((entry) => entry.number === invoiceNumber);
  if (!invoice) notFound();
  const bank = getBankTransferInstructions(invoice);
  const tossEnabled = Boolean(tossPublicConfig());

  return (
    <main className="min-h-screen bg-ivory px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto grid w-full max-w-3xl gap-6">
        <header>
          <Link href="/pay" className="text-sm font-bold text-brand-blue">← 청구 목록</Link>
          <p className="mt-6 text-xs font-black tracking-[0.2em] text-brand-blue">KPOPSOFT BILLING</p>
          <h1 className="mt-2 text-3xl font-black text-ink">{invoice.number}</h1>
          <p className="mt-2 text-sm text-ink/55">{data.customerName} · {data.siteName}</p>
        </header>

        <section className="rounded-3xl border border-ink/10 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between gap-4">
            <span className="text-sm font-bold text-ink/55">결제금액</span>
            <strong className="text-2xl font-black text-ink">{won.format(invoice.totalAmount)}</strong>
          </div>
          <div className="mt-5 divide-y divide-ink/8 border-t border-ink/10">
            {invoice.items.map((item, index) => (
              <div key={`${item.productName}-${index}`} className="flex justify-between gap-4 py-3 text-sm">
                <span className="font-semibold text-ink">{item.productName}</span>
                <span className="text-ink/55">{won.format(item.totalAmount)}</span>
              </div>
            ))}
          </div>
        </section>

        {bank ? (
          <section className="grid gap-2 rounded-3xl border border-brand-blue/15 bg-brand-blue/5 p-6">
            <h2 className="text-lg font-black text-ink">무통장 입금</h2>
            <p className="text-sm text-ink/65">{bank.bank} {bank.accountNumber}</p>
            <p className="text-sm text-ink/65">예금주 {bank.holder}</p>
            <p className="font-black text-brand-blue">입금액 {won.format(bank.amount)}</p>
          </section>
        ) : null}

        {tossEnabled ? <TossPaymentButton invoiceNumber={invoice.number} /> : null}
      </div>
    </main>
  );
}
