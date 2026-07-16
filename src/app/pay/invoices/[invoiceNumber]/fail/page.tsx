import Link from "next/link";

import { TossFailureNotice } from "@/components/billing/toss-payment-button";

export const dynamic = "force-dynamic";

function safe(value: string | string[] | undefined, max: number): string {
  return typeof value === "string" ? value.slice(0, max) : "";
}

export default async function TossFailPage({
  searchParams,
}: {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}) {
  const query = await searchParams;
  const orderId = safe(query.orderId, 64);
  const code = safe(query.code, 100);

  return (
    <main className="grid min-h-screen place-items-center bg-ivory px-5 py-16">
      <section className="w-full max-w-lg rounded-3xl border border-ink/10 bg-white p-8 text-center shadow-sm">
        <TossFailureNotice orderId={orderId} code={code} />
        <p className="text-xs font-black tracking-[0.2em] text-brand-blue">KPOPSOFT BILLING</p>
        <h1 className="mt-4 text-2xl font-black text-ink">결제가 완료되지 않았습니다</h1>
        <p className="mt-3 text-sm leading-6 text-ink/60">결제가 취소되었거나 승인되지 않았습니다. 청구서를 확인한 뒤 다시 시도해 주세요.</p>
        <Link href="/pay" className="mt-6 inline-block rounded-full border border-ink/15 px-5 py-2.5 text-sm font-bold">청구 목록으로</Link>
      </section>
    </main>
  );
}
