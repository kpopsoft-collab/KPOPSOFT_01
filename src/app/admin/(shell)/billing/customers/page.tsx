import Link from "next/link";

import { listBillingCustomersForAdmin } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function BillingCustomersPage({
  searchParams,
}: {
  searchParams: Promise<{ query?: string; status?: string }>;
}) {
  await requireBillingPageView();
  const search = await searchParams;
  const status = search.status === "ACTIVE" || search.status === "INACTIVE" ? search.status : undefined;
  const customers = await listBillingCustomersForAdmin({ query: search.query, status });

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><h1 className="text-2xl font-extrabold">고객사</h1><p className="mt-1 text-sm text-ink/55">사업자번호는 목록에 표시하지 않습니다.</p></div>
        <Link href="/admin/billing/customers/new" className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white">고객사 등록</Link>
      </header>
      <form className="flex flex-wrap gap-3 rounded-2xl border border-border bg-card p-4">
        <input name="query" defaultValue={search.query} placeholder="코드 또는 상호 검색" className="min-h-11 min-w-64 flex-1 rounded-xl border border-ink/15 px-3" />
        <select name="status" defaultValue={search.status ?? ""} className="min-h-11 rounded-xl border border-ink/15 px-3"><option value="">전체 상태</option><option value="ACTIVE">활성</option><option value="INACTIVE">비활성</option></select>
        <button className="rounded-full border border-ink/15 px-5 font-semibold">검색</button>
      </form>
      <div className="overflow-x-auto rounded-2xl border border-border bg-card">
        <table className="w-full text-left text-sm"><thead className="border-b border-border bg-ivory"><tr><th className="p-4">코드</th><th className="p-4">상호</th><th className="p-4">상태</th><th className="p-4">사이트</th><th className="p-4">담당자</th></tr></thead><tbody>
          {customers.map((customer) => <tr key={customer.id} className="border-b border-border/70 last:border-0"><td className="p-4 font-bold"><Link href={`/admin/billing/customers/${customer.id}`} className="text-brand-blue">{customer.code}</Link></td><td className="p-4">{customer.name}</td><td className="p-4">{customer.status}</td><td className="p-4">{customer.siteCount}</td><td className="p-4">{customer.contactCount}</td></tr>)}
        </tbody></table>
        {customers.length === 0 ? <p className="p-10 text-center text-sm text-ink/50">조건에 맞는 고객사가 없습니다.</p> : null}
      </div>
    </div>
  );
}
