import Link from "next/link";
import { notFound } from "next/navigation";

import { getBillingCustomerForAdmin } from "@/lib/billing/admin-data";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function BillingCustomerDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await requireBillingPageView();
  const { id } = await params;
  const customer = await getBillingCustomerForAdmin(id);
  if (!customer) notFound();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <header className="flex flex-wrap items-end justify-between gap-4">
        <div><p className="text-xs font-bold text-brand-blue">{customer.code}</p><h1 className="mt-1 text-2xl font-extrabold">{customer.name}</h1><p className="mt-1 text-sm text-ink/55">{customer.status} · 대표자 {customer.representativeName || "미등록"}</p></div>
        <Link href={`/admin/billing/contracts?new=1&customerId=${customer.id}`} className="rounded-full bg-brand-blue px-5 py-2.5 font-semibold text-white">계약 초안 만들기</Link>
      </header>
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2">
        <div><p className="text-xs font-bold text-ink/45">사업자번호</p><p className="mt-1 font-semibold">{customer.businessNumber ?? "미등록"}</p></div>
        <div><p className="text-xs font-bold text-ink/45">세금계산서 이메일(보관용)</p><p className="mt-1 font-semibold">{customer.taxEmail ?? "미등록"}</p></div>
      </section>
      <div className="grid gap-6 lg:grid-cols-2">
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">관리사이트</h2><div className="mt-4 grid gap-3">{customer.sites.map((site) => <div key={site.id} className="rounded-xl bg-ivory p-3"><p className="font-bold">{site.code} · {site.name}</p><p className="mt-1 break-all text-sm text-ink/55">{site.primaryOrigin}</p></div>)}</div></section>
        <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">청구 담당자</h2><div className="mt-4 grid gap-3">{customer.contacts.map((contact) => <div key={contact.id} className="rounded-xl bg-ivory p-3"><p className="font-bold">{contact.name}</p><p className="mt-1 text-sm text-ink/55">{contact.email} · {contact.receivesBilling ? "수신" : "수신 안 함"}</p></div>)}{customer.contacts.length === 0 ? <p className="text-sm text-ink/50">등록된 담당자가 없습니다.</p> : null}</div></section>
      </div>
      <section className="rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">계약</h2><div className="mt-4 grid gap-3">{customer.contracts.map((contract) => <Link key={contract.id} href={`/admin/billing/contracts/${contract.id}`} className="flex flex-wrap justify-between gap-2 rounded-xl bg-ivory p-3"><span className="font-semibold">{contract.siteName} · {contract.cycle}</span><span className="text-sm text-ink/55">{contract.status} · 다음 {contract.nextInvoiceDate ?? "없음"}</span></Link>)}{customer.contracts.length === 0 ? <p className="text-sm text-ink/50">등록된 계약이 없습니다.</p> : null}</div></section>
    </div>
  );
}
