"use client";

import { useState, useTransition } from "react";

import { confirmBillingBankReceipt } from "@/app/admin/(shell)/billing/actions";

const fieldClass =
  "min-h-10 rounded-lg border border-ink/15 bg-white px-3 text-sm outline-none focus:border-brand-blue";

export function BankConfirmationForm({
  invoice,
}: {
  invoice: {
    id: string;
    number: string;
    customerName: string;
    expectedAmount: number;
  };
}) {
  const [amount, setAmount] = useState(invoice.expectedAmount);
  const [depositorName, setDepositorName] = useState("");
  const [depositedOn, setDepositedOn] = useState("");
  const [evidenceNote, setEvidenceNote] = useState("");
  const [reviewing, setReviewing] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const valid =
    Number.isSafeInteger(amount) &&
    amount > 0 &&
    depositorName.trim().length > 0 &&
    /^\d{4}-\d{2}-\d{2}$/.test(depositedOn) &&
    evidenceNote.trim().length >= 5 &&
    evidenceNote.trim().length <= 500;

  const submit = () =>
    startTransition(async () => {
      setMessage("");
      try {
        await confirmBillingBankReceipt({
          invoiceId: invoice.id,
          amount,
          depositorName,
          depositedOn,
          evidenceNote,
        });
        setMessage("입금을 확인하고 청구서를 결제 완료 처리했습니다.");
      } catch (error) {
        setMessage(
          error instanceof Error ? error.message : "입금 확인을 처리하지 못했습니다.",
        );
      }
    });

  return (
    <section className="grid gap-4 rounded-2xl border border-brand-blue/20 bg-brand-blue/5 p-5">
      <div>
        <p className="text-xs font-bold text-brand-blue">관리자 수동 확인</p>
        <h2 className="mt-1 font-bold">무통장 입금 확인</h2>
      </div>
      {!reviewing ? (
        <div className="grid gap-3 sm:grid-cols-2">
          <label className="grid gap-1 text-sm font-semibold">
            입금액
            <input className={fieldClass} type="number" min={1} step={1} value={amount} onChange={(event) => setAmount(Number(event.target.value))} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            입금자명
            <input className={fieldClass} maxLength={100} value={depositorName} onChange={(event) => setDepositorName(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold">
            입금일
            <input className={fieldClass} type="date" value={depositedOn} onChange={(event) => setDepositedOn(event.target.value)} />
          </label>
          <label className="grid gap-1 text-sm font-semibold sm:col-span-2">
            확인 근거
            <textarea className="min-h-24 rounded-xl border border-ink/15 bg-white p-3 text-sm outline-none focus:border-brand-blue" minLength={5} maxLength={500} value={evidenceNote} onChange={(event) => setEvidenceNote(event.target.value)} placeholder="은행 거래내역에서 확인한 내용을 5자 이상 기록" />
          </label>
          <button type="button" disabled={!valid} className="w-fit rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white disabled:opacity-50" onClick={() => setReviewing(true)}>
            최종 확인으로 이동
          </button>
        </div>
      ) : (
        <div className="grid gap-4">
          <div className="grid gap-2 rounded-xl bg-white p-4 text-sm">
            <p><strong>고객사:</strong> {invoice.customerName}</p>
            <p><strong>청구서:</strong> {invoice.number}</p>
            <p><strong>청구금액:</strong> {invoice.expectedAmount.toLocaleString()}원</p>
            <p className={amount === invoice.expectedAmount ? "" : "font-bold text-brand-red"}><strong>입력금액:</strong> {amount.toLocaleString()}원</p>
            <p><strong>입금일:</strong> {depositedOn}</p>
            <p><strong>입금자:</strong> {depositorName.trim()}</p>
            <p className="whitespace-pre-wrap"><strong>확인 근거:</strong> {evidenceNote.trim()}</p>
          </div>
          {amount !== invoice.expectedAmount ? (
            <p className="text-sm font-bold text-brand-red">입력금액이 청구금액과 일치하지 않습니다.</p>
          ) : null}
          <div className="flex flex-wrap gap-3">
            <button type="button" disabled={pending} className="rounded-full border border-ink/15 px-5 py-2.5 font-semibold" onClick={() => setReviewing(false)}>입력 수정</button>
            <button type="button" disabled={pending || amount !== invoice.expectedAmount} className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white disabled:opacity-50" onClick={submit}>입금 확인 확정</button>
          </div>
        </div>
      )}
      {message ? <p aria-live="polite" className="text-sm font-semibold text-ink/70">{message}</p> : null}
    </section>
  );
}
