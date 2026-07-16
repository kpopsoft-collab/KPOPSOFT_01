import {
  loadPaymentPortal,
  PaymentSessionError,
  requirePaymentSession,
  type PaymentPortalData,
} from "@/lib/billing/widget/payment-session";
import { getBankTransferInstructions } from "@/lib/billing/payments/bank";

export const dynamic = "force-dynamic";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

const date = new Intl.DateTimeFormat("ko-KR", {
  year: "numeric",
  month: "long",
  day: "numeric",
  timeZone: "Asia/Seoul",
});

function formatDate(value: string): string {
  return date.format(new Date(`${value}T00:00:00+09:00`));
}

function SessionUnavailable() {
  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-5 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-ink/10 bg-white p-7 text-center shadow-sm sm:p-10">
        <p className="text-xs font-black tracking-[0.2em] text-brand-blue">
          KPOPSOFT BILLING
        </p>
        <h1 className="mt-4 text-2xl font-black text-ink">
          결제 연결이 만료되었습니다
        </h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">
          고객사 관리사이트로 돌아가 결제 버튼을 다시 눌러 주세요. 만료된
          연결에서는 청구 정보를 표시하지 않습니다.
        </p>
      </section>
    </main>
  );
}

function EmptyInvoices({ data }: { data: PaymentPortalData }) {
  return (
    <section className="rounded-3xl border border-ink/10 bg-white p-7 text-center sm:p-10">
      <h2 className="text-xl font-black text-ink">결제할 청구서가 없습니다</h2>
      <p className="mt-2 text-sm text-ink/55">
        {data.siteName} 사이트의 미납 청구가 모두 처리되었습니다.
      </p>
    </section>
  );
}

export default async function PayPage() {
  let data: PaymentPortalData;
  try {
    const session = await requirePaymentSession();
    data = await loadPaymentPortal(session);
  } catch (error) {
    if (error instanceof PaymentSessionError) return <SessionUnavailable />;
    throw error;
  }

  return (
    <main className="min-h-screen bg-ivory px-5 py-10 sm:px-8 sm:py-14">
      <div className="mx-auto w-full max-w-4xl">
        <header className="mb-7 flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="text-xs font-black tracking-[0.2em] text-brand-blue">
              KPOPSOFT BILLING
            </p>
            <h1 className="mt-2 text-3xl font-black text-ink">청구 및 결제</h1>
          </div>
          <div className="rounded-2xl bg-white px-4 py-3 text-right shadow-sm">
            <p className="text-sm font-bold text-ink">{data.customerName}</p>
            <p className="mt-1 text-xs text-ink/50">{data.siteName}</p>
          </div>
        </header>

        {data.invoices.length === 0 ? (
          <EmptyInvoices data={data} />
        ) : (
          <div className="grid gap-5">
            {data.invoices.map((invoice) => {
              const bank = getBankTransferInstructions(invoice);
              return (
              <article
                key={invoice.number}
                className="overflow-hidden rounded-3xl border border-ink/10 bg-white shadow-sm"
              >
                <div className="flex flex-col gap-3 border-b border-ink/10 p-5 sm:flex-row sm:items-start sm:justify-between sm:p-6">
                  <div>
                    <div className="flex flex-wrap items-center gap-2">
                      <h2 className="font-black text-ink">{invoice.number}</h2>
                      <span
                        className={`rounded-full px-2.5 py-1 text-[11px] font-black ${
                          invoice.status === "OVERDUE"
                            ? "bg-brand-red/10 text-brand-red"
                            : "bg-brand-blue/10 text-brand-blue"
                        }`}
                      >
                        {invoice.status === "OVERDUE" ? "기한 경과" : "결제 가능"}
                      </span>
                    </div>
                    <p className="mt-2 text-xs text-ink/50">
                      발행 {formatDate(invoice.issueDate)} · 납부기한 {formatDate(invoice.dueDate)}
                    </p>
                  </div>
                  <p className="text-2xl font-black text-ink">
                    {won.format(invoice.totalAmount)}
                  </p>
                </div>

                <div className="divide-y divide-ink/8 px-5 sm:px-6">
                  {invoice.items.map((item, index) => (
                    <div
                      key={`${item.productName}-${index}`}
                      className="flex flex-col gap-1 py-4 sm:flex-row sm:items-center sm:justify-between"
                    >
                      <div>
                        <p className="text-sm font-bold text-ink">
                          {item.productName}
                        </p>
                        {item.description ? (
                          <p className="mt-1 text-xs text-ink/50">
                            {item.description}
                          </p>
                        ) : null}
                      </div>
                      <p className="text-sm font-semibold text-ink/70">
                        {item.quantity} × {won.format(item.unitSupplyAmount)}
                      </p>
                    </div>
                  ))}
                </div>

                <dl className="grid gap-2 border-t border-ink/10 bg-ink/[0.025] p-5 text-sm sm:p-6">
                  <div className="flex justify-between text-ink/55">
                    <dt>공급가액</dt>
                    <dd>{won.format(invoice.supplyAmount)}</dd>
                  </div>
                  <div className="flex justify-between text-ink/55">
                    <dt>부가세</dt>
                    <dd>{won.format(invoice.vatAmount)}</dd>
                  </div>
                  <div className="mt-1 flex justify-between border-t border-ink/10 pt-3 font-black text-ink">
                    <dt>결제금액</dt>
                    <dd>{won.format(invoice.totalAmount)}</dd>
                  </div>
                </dl>
                {bank ? (
                  <section className="grid gap-2 border-t border-brand-blue/15 bg-brand-blue/5 p-5 text-sm sm:p-6">
                    <h3 className="font-black text-ink">무통장 입금</h3>
                    <p className="text-ink/65">{bank.bank} {bank.accountNumber} · 예금주 {bank.holder}</p>
                    <p className="font-bold text-brand-blue">입금액 {won.format(bank.amount)}</p>
                    <p className="text-xs leading-5 text-ink/50">입금 확인 후 결제 완료로 반영됩니다. 청구금액과 동일한 금액을 입금해 주세요.</p>
                  </section>
                ) : null}
              </article>
              );
            })}
          </div>
        )}

        <p className="mt-7 text-center text-xs leading-5 text-ink/45">
          결제 수단은 KPOPSOFT 서버가 확인한 청구금액을 기준으로 표시됩니다.
          브라우저에서 입력한 금액은 사용하지 않습니다.
        </p>
      </div>
    </main>
  );
}
