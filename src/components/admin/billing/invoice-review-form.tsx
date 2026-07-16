"use client";

import { useState, useTransition } from "react";

import {
  approveBillingInvoice,
  retryBillingInvoiceDelivery,
  updateBillingInvoiceDraft,
  voidBillingInvoice,
} from "@/app/admin/(shell)/billing/actions";
import type { InvoiceStatus } from "@/lib/billing/types";

type ReviewItem = {
  productCode: string;
  productName: string;
  description: string;
  quantity: number;
  unitSupplyAmount: number;
  vatAmount: number;
};

type Delivery = {
  id: string;
  recipient: string;
  status: "PENDING" | "SENT" | "FAILED";
  attemptCount: number;
  errorCode: string | null;
};

const fieldClass =
  "min-h-10 rounded-lg border border-ink/15 bg-white px-3 text-sm outline-none focus:border-brand-blue";

export function InvoiceReviewForm({
  invoice,
}: {
  invoice: {
    id: string;
    status: InvoiceStatus;
    periodStart: string;
    periodEnd: string;
    issueDate: string;
    dueDate: string;
    items: ReviewItem[];
    deliveries: Delivery[];
  };
}) {
  const [periodStart, setPeriodStart] = useState(invoice.periodStart);
  const [periodEnd, setPeriodEnd] = useState(invoice.periodEnd);
  const [issueDate, setIssueDate] = useState(invoice.issueDate);
  const [dueDate, setDueDate] = useState(invoice.dueDate);
  const [items, setItems] = useState(invoice.items);
  const [voidReason, setVoidReason] = useState("");
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const run = (operation: () => Promise<void>, success: string) =>
    startTransition(async () => {
      setMessage("");
      try {
        await operation();
        setMessage(success);
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "처리하지 못했습니다.",
        );
      }
    });

  return (
    <div className="grid gap-6">
      {invoice.status === "DRAFT" ? (
        <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
          <h2 className="font-bold">초안 편집</h2>
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {[
              ["기간 시작", periodStart, setPeriodStart],
              ["기간 종료", periodEnd, setPeriodEnd],
              ["발행일", issueDate, setIssueDate],
              ["납부기한", dueDate, setDueDate],
            ].map(([label, value, setter]) => (
              <label key={label as string} className="grid gap-1 text-sm font-semibold">
                {label as string}
                <input className={fieldClass} type="date" value={value as string} onChange={(event) => (setter as (value: string) => void)(event.target.value)} />
              </label>
            ))}
          </div>
          <div className="grid gap-3">
            {items.map((item, index) => (
              <div key={`${item.productCode}-${index}`} className="grid gap-2 rounded-xl bg-ivory p-3 lg:grid-cols-6">
                <input className={fieldClass} value={item.productCode} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, productCode: event.target.value } : entry))} aria-label="상품 코드" />
                <input className={fieldClass} value={item.productName} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, productName: event.target.value } : entry))} aria-label="상품명" />
                <input className={fieldClass} value={item.description} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, description: event.target.value } : entry))} aria-label="설명" />
                <input className={fieldClass} type="number" min={1} value={item.quantity} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, quantity: Number(event.target.value) } : entry))} aria-label="수량" />
                <input className={fieldClass} type="number" min={0} value={item.unitSupplyAmount} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, unitSupplyAmount: Number(event.target.value) } : entry))} aria-label="단가" />
                <input className={fieldClass} type="number" min={0} value={item.vatAmount} onChange={(event) => setItems((current) => current.map((entry, itemIndex) => itemIndex === index ? { ...entry, vatAmount: Number(event.target.value) } : entry))} aria-label="부가세" />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap gap-3">
            <button
              type="button"
              disabled={pending}
              className="rounded-full border border-ink/15 px-5 py-2.5 font-semibold"
              onClick={() => run(() => updateBillingInvoiceDraft(invoice.id, { periodStart, periodEnd, issueDate, dueDate, items }), "초안을 저장했습니다.")}
            >
              초안 저장
            </button>
            <button
              type="button"
              disabled={pending}
              className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white"
              onClick={() => {
                if (window.confirm("금액과 수신자를 확인했습니다. 이 청구서를 승인할까요?")) {
                  run(() => approveBillingInvoice(invoice.id), "청구서를 승인했습니다.");
                }
              }}
            >
              승인 및 이메일 발송
            </button>
          </div>
        </section>
      ) : null}

      {["DRAFT", "OPEN", "OVERDUE"].includes(invoice.status) ? (
        <section className="grid gap-3 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-5">
          <h2 className="font-bold">청구서 무효화</h2>
          <textarea className="min-h-24 rounded-xl border border-ink/15 bg-white p-3 text-sm" value={voidReason} onChange={(event) => setVoidReason(event.target.value)} placeholder="5자 이상의 처리 사유" />
          <button
            type="button"
            disabled={pending || voidReason.trim().length < 5}
            className="w-fit rounded-full bg-brand-red px-5 py-2.5 font-semibold text-white disabled:opacity-50"
            onClick={() => {
              if (window.confirm("이 청구서는 결제할 수 없게 됩니다. 무효 처리할까요?")) {
                run(() => voidBillingInvoice(invoice.id, voidReason), "청구서를 무효 처리했습니다.");
              }
            }}
          >
            무효 처리
          </button>
        </section>
      ) : null}

      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold">이메일 전송</h2>
        {invoice.deliveries.length === 0 ? (
          <p className="text-sm text-ink/55">등록된 청구 수신자가 없습니다.</p>
        ) : (
          invoice.deliveries.map((delivery) => (
            <div key={delivery.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl bg-ivory p-3 text-sm">
              <span>{delivery.recipient} · {delivery.status} · {delivery.attemptCount}회</span>
              {delivery.status !== "SENT" ? (
                <button type="button" disabled={pending} className="rounded-full border border-ink/15 px-4 py-2 font-semibold" onClick={() => run(() => retryBillingInvoiceDelivery(delivery.id), "이메일 전송을 다시 시도했습니다.")}>재시도</button>
              ) : null}
            </div>
          ))
        )}
      </section>
      {message ? <p aria-live="polite" className="text-sm font-semibold text-ink/70">{message}</p> : null}
    </div>
  );
}
