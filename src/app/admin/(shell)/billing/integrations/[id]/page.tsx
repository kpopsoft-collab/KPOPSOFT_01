import Link from "next/link";
import { notFound } from "next/navigation";

import { IntegrationLifecycleManager } from "@/components/admin/billing/integration-manager";
import { requireBillingPageView } from "@/lib/billing/page-auth";
import { getWidgetIntegrationForAdmin } from "@/lib/billing/widget/integrations";

export default async function BillingIntegrationDetailPage({ params }: { params: Promise<{ id: string }> }) {
  await requireBillingPageView();
  const { id } = await params;
  const integration = await getWidgetIntegrationForAdmin(id);
  if (!integration) notFound();
  const embed = `<script src="https://pay.kpopsoft.com/widgets/kpopsoft-billing.v1.js" defer></script>\n<kpopsoft-billing public-id="${integration.publicId}" token-endpoint="/api/kpopsoft/billing-token"></kpopsoft-billing>`;
  return (
    <div className="mx-auto flex max-w-5xl flex-col gap-6">
      <header><Link href="/admin/billing/integrations" className="text-sm font-bold text-brand-blue">← 사이트 연동</Link><p className="mt-5 text-xs font-bold text-brand-blue">{integration.customerName} · {integration.siteCode}</p><h1 className="mt-1 text-2xl font-extrabold">{integration.siteName}</h1><p className="mt-2 font-mono text-xs text-ink/55">{integration.publicId}</p></header>
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5 sm:grid-cols-2"><div><p className="text-xs font-bold text-ink/45">허용 origin</p><p className="mt-1 break-all text-sm font-semibold">{integration.allowedOrigin}</p></div><div><p className="text-xs font-bold text-ink/45">상태·키 버전</p><p className="mt-1 text-sm font-semibold">{integration.status} · v{integration.keyVersion}</p></div><div><p className="text-xs font-bold text-ink/45">마지막 사용</p><p className="mt-1 text-sm font-semibold">{integration.lastUsedAt?.toLocaleString("ko-KR") ?? "아직 사용 없음"}</p></div><div><p className="text-xs font-bold text-ink/45">마지막 회전</p><p className="mt-1 text-sm font-semibold">{integration.rotatedAt?.toLocaleString("ko-KR") ?? "회전 이력 없음"}</p></div></section>
      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5"><h2 className="font-bold">사이트 삽입 HTML</h2><pre className="overflow-x-auto whitespace-pre-wrap rounded-xl bg-ink p-4 text-xs leading-6 text-white"><code>{embed}</code></pre><p className="text-xs text-ink/55">토큰 엔드포인트는 고객사 로그인 세션을 먼저 검증해야 합니다.</p></section>
      <IntegrationLifecycleManager integration={{ id: integration.id, publicId: integration.publicId, keyVersion: integration.keyVersion, status: integration.status }} />
    </div>
  );
}
