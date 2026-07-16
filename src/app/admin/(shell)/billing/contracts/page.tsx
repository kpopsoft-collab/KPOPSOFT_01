import Link from "next/link";

import { ContractForm } from "@/components/admin/billing/contract-form";
import { getContractFormOptions, isContractStatus, listBillingContractsForAdmin } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function BillingContractsPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string; new?: string; customerId?: string }>;
}) {
  await requireBillingPageView();
  const search = await searchParams;
  const [contracts, options] = await Promise.all([
    listBillingContractsForAdmin({ query: search.query, status: isContractStatus(search.status) ? search.status : undefined, customerId: search.customerId }),
    getContractFormOptions(),
  ]);
  const showNew = search.new === "1";

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4"><div><h1 className="text-2xl font-extrabold">계약</h1><p className="mt-1 text-sm text-ink/55">상태, 주기와 다음 청구일을 관리합니다.</p></div><Link href={showNew ? "/admin/billing/contracts" : "/admin/billing/contracts?new=1"} className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white">{showNew ? "목록 보기" : "계약 초안 만들기"}</Link></header>
      {showNew ? <section className="rounded-2xl border border-border bg-card p-5"><ContractForm {...options} initialCustomerId={search.customerId} /></section> : null}
      <form className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4"><input name="query" defaultValue={search.query} placeholder="고객사 또는 사이트 검색" className="min-h-11 min-w-64 flex-1 rounded-xl border border-ink/15 px-3" /><select name="status" defaultValue={search.status ?? ""} className="min-h-11 rounded-xl border border-ink/15 px-3"><option value="">전체 상태</option>{["DRAFT","ACTIVE","SUSPENDED","ENDED","CANCELED"].map((status) => <option key={status}>{status}</option>)}</select><button className="rounded-full border border-ink/15 px-5 font-semibold">검색</button></form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-ivory"><tr><th className="p-4">고객사</th><th className="p-4">사이트</th><th className="p-4">상태·주기</th><th className="p-4">다음 청구일</th><th className="p-4 text-right">계약 금액</th></tr></thead><tbody>{contracts.map((contract) => <tr key={contract.id} className="border-b border-border/70 last:border-0"><td className="p-4"><Link href={`/admin/billing/contracts/${contract.id}`} className="font-bold text-brand-blue">{contract.customerCode} · {contract.customerName}</Link></td><td className="p-4">{contract.siteName}</td><td className="p-4">{contract.status} · {contract.cycle}</td><td className="p-4">{contract.nextInvoiceDate ?? "-"}</td><td className="p-4 text-right font-semibold">{contract.totalAmount.toLocaleString()}원</td></tr>)}</tbody></table>{contracts.length === 0 ? <p className="p-10 text-center text-sm text-ink/50">조건에 맞는 계약이 없습니다.</p> : null}</div>
    </div>
  );
}
