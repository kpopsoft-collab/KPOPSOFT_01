import Link from "next/link";

import { isInvoiceStatus, listBillingInvoicesForAdmin } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function BillingInvoicesPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  await requireBillingPageView();
  const search = await searchParams;
  const invoices = await listBillingInvoicesForAdmin({ query: search.query, status: isInvoiceStatus(search.status) ? search.status : undefined });

  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><h1 className="text-2xl font-extrabold">청구서</h1><p className="mt-1 text-sm text-ink/55">초안은 승인 전까지 고객에게 공개되지 않습니다.</p></header>
      <form className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4"><input name="query" defaultValue={search.query} placeholder="청구번호 또는 고객사 검색" className="min-h-11 min-w-64 flex-1 rounded-xl border border-ink/15 px-3" /><select name="status" defaultValue={search.status ?? ""} className="min-h-11 rounded-xl border border-ink/15 px-3"><option value="">전체 상태</option>{["DRAFT","OPEN","PAID","OVERDUE","PARTIALLY_REFUNDED","REFUNDED","VOID"].map((status) => <option key={status}>{status}</option>)}</select><button className="rounded-full border border-ink/15 px-5 font-semibold">검색</button></form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card"><table className="w-full text-left text-sm"><thead className="border-b border-border bg-ivory"><tr><th className="p-4">청구번호</th><th className="p-4">고객사·사이트</th><th className="p-4">상태</th><th className="p-4">기간·기한</th><th className="p-4 text-right">금액</th></tr></thead><tbody>{invoices.map((invoice) => <tr key={invoice.id} className="border-b border-border/70 last:border-0"><td className="p-4"><Link href={`/admin/billing/invoices/${invoice.id}`} className="font-bold text-brand-blue">{invoice.number}</Link></td><td className="p-4">{invoice.customerCode} · {invoice.customerName}<br/><span className="text-ink/50">{invoice.siteName}</span></td><td className="p-4">{invoice.status}</td><td className="p-4">{invoice.periodStart} ~ {invoice.periodEnd}<br/><span className="text-ink/50">납부 {invoice.dueDate}</span></td><td className="p-4 text-right font-semibold">{invoice.totalAmount.toLocaleString()}원</td></tr>)}</tbody></table>{invoices.length === 0 ? <p className="p-10 text-center text-sm text-ink/50">조건에 맞는 청구서가 없습니다.</p> : null}</div>
    </div>
  );
}
