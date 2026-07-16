import Link from "next/link";

import { TossSuccessBridge } from "@/components/billing/toss-payment-button";

export const dynamic = "force-dynamic";

function safe(value: string | string[] | undefined, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export default async function TossSuccessPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const paymentKey = safe(query.paymentKey, 200);
  const orderId = safe(query.orderId, 64);
  const amount = safe(query.amount, 20);

  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-5 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-sm">
        <p className="text-xs font-black tracking-[0.2em] text-brand-blue">KPOPSOFT BILLING</p>
        <h1 className="mt-4 text-2xl font-black text-ink">결제 승인 확인</h1>
        <TossSuccessBridge paymentKey={paymentKey} orderId={orderId} amount={amount} />
        <Link href="/pay" className="mt-6 inline-block rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold">청구 목록으로</Link>
      </section>
    </main>
  );
}
