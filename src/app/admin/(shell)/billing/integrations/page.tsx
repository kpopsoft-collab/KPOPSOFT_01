import Link from "next/link";

import { CreateIntegrationManager } from "@/components/admin/billing/integration-manager";
import { requireBillingPageView } from "@/lib/billing/page-auth";
import { listWidgetIntegrationsForAdmin } from "@/lib/billing/widget/integrations";

export default async function BillingIntegrationsPage() {
  await requireBillingPageView();
  const data = await listWidgetIntegrationsForAdmin();
  return (
    <div className="mx-auto flex max-w-7xl flex-col gap-6">
      <header><p className="text-xs font-bold text-brand-blue">CUSTOMER SITE WIDGET</p><h1 className="mt-1 text-2xl font-extrabold">사이트 연동</h1><p className="mt-2 text-sm text-ink/55">사이트별 공개 ID, origin, 키 버전과 사용 상태를 관리합니다.</p></header>
      <CreateIntegrationManager sites={data.sites} />
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">등록된 연동</h2>{data.integrations.length === 0 ? <p className="text-sm text-ink/55">등록된 연동이 없습니다.</p> : data.integrations.map((integration) => <Link key={integration.id} href={`/admin/billing/integrations/${integration.id}`} className="grid gap-1 rounded-xl bg-ivory p-4 text-sm sm:grid-cols-[1fr_auto]"><div><p className="font-bold">{integration.customerName} · {integration.siteCode} · {integration.siteName}</p><p className="mt-1 font-mono text-xs text-ink/55">{integration.publicId}</p><p className="mt-1 text-xs text-ink/55">{integration.allowedOrigin}</p></div><p className="font-bold text-brand-blue">{integration.status} · v{integration.keyVersion}</p></Link>)}</section>
    </div>
  );
}
