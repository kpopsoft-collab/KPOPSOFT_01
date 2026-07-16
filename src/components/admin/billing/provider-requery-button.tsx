"use client";

import { useState, useTransition } from "react";

import { requeryBillingPaymentProvider } from "@/app/admin/(shell)/billing/payment-actions";

export function ProviderRequeryButton({ paymentId }: { paymentId: string }) {
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  return (
    <div className="grid gap-2">
      <button
        type="button"
        disabled={pending}
        className="w-fit rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold disabled:opacity-50"
        onClick={() =>
          startTransition(async () => {
            setMessage("");
            try {
              const result = await requeryBillingPaymentProvider(paymentId);
              setMessage(
                `토스 ${result.providerStatus} · 잔액 ${result.balanceAmount.toLocaleString()}원 · ${new Date(result.checkedAt).toLocaleString("ko-KR")}`,
              );
            } catch (error) {
              setMessage(error instanceof Error ? error.message : "토스 상태를 확인하지 못했습니다.");
            }
          })
        }
      >
        {pending ? "조회 중…" : "토스 상태 다시 조회"}
      </button>
      {message ? <p aria-live="polite" className="text-xs text-ink/55">{message}</p> : null}
    </div>
  );
}
