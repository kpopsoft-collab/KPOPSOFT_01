"use client";

import { useEffect, useRef, useState, useTransition } from "react";

type TossWidgets = {
  setAmount(input: { currency: "KRW"; value: number }): Promise<void>;
  renderPaymentMethods(input: { selector: string; variantKey: "DEFAULT" }): Promise<void>;
  renderAgreement(input: { selector: string; variantKey: "AGREEMENT" }): Promise<void>;
  requestPayment(input: {
    orderId: string;
    orderName: string;
    successUrl: string;
    failUrl: string;
    customerName: string;
  }): Promise<void>;
};

type TossPaymentsFactory = (clientKey: string) => {
  widgets(input: { customerKey: string }): TossWidgets;
};

declare global {
  interface Window {
    TossPayments?: TossPaymentsFactory;
  }
}

type AttemptResponse = {
  ok: true;
  orderId: string;
  amount: number;
  clientKey: string;
  expiresAt: string;
  orderName: string;
  customerName: string;
  customerKey: string;
  successUrl: string;
  failUrl: string;
};

let sdkPromise: Promise<TossPaymentsFactory> | null = null;

function loadTossSdk(): Promise<TossPaymentsFactory> {
  if (window.TossPayments) return Promise.resolve(window.TossPayments);
  if (!sdkPromise) {
    sdkPromise = new Promise((resolve, reject) => {
      const script = document.createElement("script");
      script.src = "https://js.tosspayments.com/v2/standard";
      script.async = true;
      script.onload = () =>
        window.TossPayments
          ? resolve(window.TossPayments)
          : reject(new Error("결제 모듈을 불러오지 못했습니다."));
      script.onerror = () => reject(new Error("결제 모듈을 불러오지 못했습니다."));
      document.head.appendChild(script);
    });
  }
  return sdkPromise;
}

export function TossPaymentButton({ invoiceNumber }: { invoiceNumber: string }) {
  const widgets = useRef<TossWidgets | null>(null);
  const attempt = useRef<AttemptResponse | null>(null);
  const [ready, setReady] = useState(false);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  const prepare = () =>
    startTransition(async () => {
      setMessage("");
      try {
        const response = await fetch(
          `/api/payments/toss/attempts?invoiceNumber=${encodeURIComponent(invoiceNumber)}`,
          { method: "POST", cache: "no-store", headers: { Accept: "application/json" } },
        );
        const result = (await response.json()) as AttemptResponse | { ok: false };
        if (!response.ok || !result.ok) throw new Error("토스 결제를 시작할 수 없습니다.");
        const TossPayments = await loadTossSdk();
        const nextWidgets = TossPayments(result.clientKey).widgets({
          customerKey: result.customerKey,
        });
        await nextWidgets.setAmount({ currency: "KRW", value: result.amount });
        await nextWidgets.renderPaymentMethods({
          selector: "#toss-payment-methods",
          variantKey: "DEFAULT",
        });
        await nextWidgets.renderAgreement({
          selector: "#toss-payment-agreement",
          variantKey: "AGREEMENT",
        });
        widgets.current = nextWidgets;
        attempt.current = result;
        setReady(true);
      } catch (error) {
        setMessage(error instanceof Error ? error.message : "토스 결제를 시작할 수 없습니다.");
      }
    });

  const checkout = () =>
    startTransition(async () => {
      setMessage("");
      const currentWidgets = widgets.current;
      const currentAttempt = attempt.current;
      if (!currentWidgets || !currentAttempt) return;
      try {
        await currentWidgets.requestPayment({
          orderId: currentAttempt.orderId,
          orderName: currentAttempt.orderName,
          successUrl: currentAttempt.successUrl,
          failUrl: currentAttempt.failUrl,
          customerName: currentAttempt.customerName,
        });
      } catch {
        setMessage("결제가 취소되었거나 결제창을 열지 못했습니다.");
      }
    });

  return (
    <section className="grid gap-4 rounded-3xl border border-ink/10 bg-white p-5 shadow-sm sm:p-6">
      <div>
        <p className="text-xs font-black tracking-[0.16em] text-brand-blue">TOSS PAYMENTS</p>
        <h2 className="mt-2 text-xl font-black text-ink">카드·간편결제</h2>
      </div>
      <div id="toss-payment-methods" />
      <div id="toss-payment-agreement" />
      {!ready ? (
        <button type="button" disabled={pending} onClick={prepare} className="rounded-full bg-brand-blue px-5 py-3 font-bold text-white disabled:opacity-50">결제 수단 불러오기</button>
      ) : (
        <button type="button" disabled={pending} onClick={checkout} className="rounded-full bg-brand-blue px-5 py-3 font-bold text-white disabled:opacity-50">토스로 결제하기</button>
      )}
      {message ? <p aria-live="polite" className="text-sm font-semibold text-brand-red">{message}</p> : null}
    </section>
  );
}

export function TossSuccessBridge({
  paymentKey,
  orderId,
  amount,
}: {
  paymentKey: string;
  orderId: string;
  amount: string;
}) {
  const [message, setMessage] = useState("결제 승인 결과를 확인하고 있습니다.");

  useEffect(() => {
    const controller = new AbortController();
    void fetch("/api/payments/toss/confirm", {
      method: "POST",
      cache: "no-store",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ paymentKey, orderId, amount: Number(amount) }),
      signal: controller.signal,
    })
      .then(async (response) => {
        const result = (await response.json()) as { status?: string };
        if (!response.ok) throw new Error("결제 승인 결과를 확인하지 못했습니다.");
        setMessage(
          result.status === "DONE"
            ? "결제가 완료되었습니다."
            : "결제 승인 결과를 확인 중입니다. 잠시 후 다시 확인해 주세요.",
        );
      })
      .catch((error: unknown) => {
        if (error instanceof DOMException && error.name === "AbortError") return;
        setMessage("결제 승인 결과를 확인하지 못했습니다. 고객센터에 문의해 주세요.");
      });
    return () => controller.abort();
  }, [amount, orderId, paymentKey]);

  return <p aria-live="polite" className="mt-4 text-sm font-semibold text-ink/65">{message}</p>;
}

export function TossFailureNotice({ orderId, code }: { orderId: string; code: string }) {
  useEffect(() => {
    if (!orderId || !code) return;
    void fetch("/api/payments/toss/attempts", {
      method: "PATCH",
      cache: "no-store",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ orderId, code }),
    }).catch(() => undefined);
  }, [code, orderId]);
  return null;
}
