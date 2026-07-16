import { notFound } from "next/navigation";

import { changeBillingContractState } from "@/app/admin/(shell)/billing/actions";
import { ContractForm } from "@/components/admin/billing/contract-form";
import { getBillingContractForAdmin, getContractFormOptions } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";
import { CONTRACT_TRANSITIONS } from "@/lib/billing/transitions";

export default async function BillingContractDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBillingPageView();
  const { id } = await params;
  const [contract, options] = await Promise.all([
    getBillingContractForAdmin(id),
    getContractFormOptions(),
  ]);
  if (!contract) notFound();

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><p className="text-xs font-bold text-brand-blue">{contract.customerName} · {contract.siteName}</p><h1 className="mt-1 text-2xl font-extrabold">계약 상세</h1><p className="mt-1 text-sm text-ink/55">{contract.status} · {contract.cycle} · 다음 청구일 {contract.nextInvoiceDate ?? "없음"}</p></header>
      {CONTRACT_TRANSITIONS[contract.status].length > 0 ? (
        <section className="flex flex-wrap items-center gap-3 rounded-2xl border border-border bg-card p-4"><span className="text-sm font-bold">상태 변경</span>{CONTRACT_TRANSITIONS[contract.status].map((status) => <form key={status} action={changeBillingContractState.bind(null, contract.id, status)}><button className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold">{status}</button></form>)}</section>
      ) : null}
      <section className="rounded-2xl border border-border bg-card p-5">
        <ContractForm
          {...options}
          initial={{
            id: contract.id,
            customerId: contract.customerId,
            siteId: contract.siteId,
            status: contract.status,
            cycle: contract.cycle,
            startDate: contract.startDate,
            endDate: contract.endDate,
            billingAnchorDay: contract.billingAnchorDay,
            nextInvoiceDate: contract.nextInvoiceDate,
            dueDays: contract.dueDays,
            autoRenew: contract.autoRenew,
            items: contract.items.map((item) => ({
              productId: item.productId,
              description: item.description,
              quantity: item.quantity,
              unitSupplyAmount: item.unitSupplyAmount,
              vatAmount: item.vatAmount,
            })),
          }}
        />
      </section>
    </div>
  );
}
