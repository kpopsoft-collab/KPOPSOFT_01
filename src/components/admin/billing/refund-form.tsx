"use client";

import { useState, useTransition } from "react";

import { requestBillingTossRefund } from "@/app/admin/(shell)/billing/payment-actions";

const won = new Intl.NumberFormat("ko-KR", {
  style: "currency",
  currency: "KRW",
  maximumFractionDigits: 0,
});

export function RefundForm({
  payment,
}: {
  payment: {
    id: string;
    customerName: string;
    invoiceNumber: string;
    amount: number;
    refundedAmount: number;
  };
}) {
  const maximum = payment.amount - payment.refundedAmount;
  const [amount, setAmount] = useState(maximum);
  const [reason, setReason] = useState("");
  const [confirmed, setConfirmed] = useState(false);
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const valid =
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    amount <= maximum &&
    reason.trim().length >= 5 &&
    reason.trim().length <= 200;

  const submit = () =>
    startTransition(async () => {
      setMessage("");
      try {
        const result = await requestBillingTossRefund({
          paymentId: payment.id,
          amount,
          reason,
        });
        setMessage(
          result.status === "DONE"
            ? "환불이 완료되었습니다."
            : result.status === "PROCESSING"
              ? "토스 처리 결과를 확인 중입니다. 중복 요청하지 마세요."
              : "환불이 거절되었습니다. 결제 상태를 다시 확인해 주세요.",
        );
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "환불을 요청하지 못했습니다.");
      }
    });

  return (
    <section className="grid gap-4 rounded-2xl border border-brand-red/20 bg-brand-red/5 p-5">
      <div>
        <p className="text-xs font-bold text-brand-red">고위험 작업 · 재인증 필요</p>
        <h2 className="mt-1 font-bold">토스 결제 환불</h2>
      </div>
      {!reviewing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">환불 금액<input type="number" min={1} max={maximum} step={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} className="min-h-10 rounded-lg border border-ink/15 bg-white px-3" /></label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">환불 사유<textarea minLength={5} maxLength={200} value={reason} onChange={(event) => setReason(event.target.value)} className="min-h-24 rounded-xl border border-ink/15 bg-white p-3 text-sm" /></label>
          <button type="button" disabled={!valid} onClick={() => setReviewing(true)} className="w-fit rounded-full bg-brand-red px-5 py-2.5 font-semibold text-white disabled:opacity-50">최종 확인으로 이동</button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2 rounded-xl bg-white p-4 text-sm">
            <p><strong>고객사:</strong> {payment.customerName}</p>
            <p><strong>청구서:</strong> {payment.invoiceNumber}</p>
            <p><strong>원 결제:</strong> {won.format(payment.amount)}</p>
            <p><strong>기환불:</strong> {won.format(payment.refundedAmount)}</p>
            <p><strong>환불 가능:</strong> {won.format(maximum)}</p>
            <p className="font-bold text-brand-red"><strong>요청 환불:</strong> {won.format(amount)}</p>
            <p><strong>환불 후 잔액:</strong> {won.format(maximum - amount)}</p>
            <p className="whitespace-pre-wrap"><strong>사유:</strong> {reason.trim()}</p>
          </div>
          <label className="flex items-start gap-2 text-sm font-semibold"><input type="checkbox" checked={confirmed} onChange={(event) => setConfirmed(event.target.checked)} className="mt-1" />환불 금액과 사유를 확인했으며 취소가 즉시 처리될 수 있음을 이해했습니다.</label>
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending} onClick={() => { setReviewing(false); setConfirmed(false); }} className="rounded-full border border-ink/15 px-5 py-2.5 font-semibold">입력 수정</button>
            <button type="button" disabled={pending || !confirmed || !valid} onClick={submit} className="rounded-full bg-brand-red px-5 py-2.5 font-semibold text-white disabled:opacity-50">환불 요청 확정</button>
          </div>
        </div>
      )}
      {message ? <p aria-live="polite" className="text-sm font-semibold text-ink/70">{message}</p> : null}
    </section>
  );
}
