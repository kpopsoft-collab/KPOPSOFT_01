"use client";

import { useState, useTransition } from "react";

import {
  createWidgetIntegration,
  rotateWidgetIntegration,
  setWidgetIntegrationEnabled,
} from "@/app/admin/(shell)/billing/integration-actions";
import { IntegrationKeyDialog } from "@/components/admin/billing/integration-key-dialog";

type Credential = { publicId: string; secret: string; keyVersion: number };

export function CreateIntegrationManager({
  sites,
}: {
  sites: Array<{
    id: string;
    code: string;
    name: string;
    customerName: string;
    primaryOrigin: string;
  }>;
}) {
  const [siteId, setSiteId] = useState(sites[0]?.id ?? "");
  const selected = sites.find((site) => site.id === siteId);
  const [credential, setCredential] = useState<Credential | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();

  return (
    <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
      <div><h2 className="font-bold">새 사이트 연동</h2><p className="mt-1 text-sm text-ink/55">활성 사이트의 등록 origin과 정확히 일치하는 연동을 만듭니다.</p></div>
      {sites.length === 0 ? <p className="text-sm text-ink/55">연동 가능한 활성 사이트가 없습니다.</p> : <div className="flex flex-col gap-3 sm:flex-row sm:items-end"><label className="grid flex-1 gap-1 text-sm font-semibold">고객사 사이트<select className="min-h-11 rounded-xl border border-ink/15 bg-white px-3" value={siteId} onChange={(event) => setSiteId(event.target.value)}>{sites.map((site) => <option key={site.id} value={site.id}>{site.customerName} · {site.code} · {site.name}</option>)}</select></label><button type="button" disabled={pending || !selected} className="min-h-11 rounded-full bg-brand-blue px-5 font-bold text-white disabled:opacity-50" onClick={() => startTransition(async () => { if (!selected) return; setMessage(""); try { const result = await createWidgetIntegration(selected.id, selected.primaryOrigin); if (!result.ok || !result.publicId || !result.secret || !result.keyVersion) throw new Error("연동을 만들지 못했습니다."); setCredential({ publicId: result.publicId, secret: result.secret, keyVersion: result.keyVersion }); } catch (error) { setMessage(error instanceof Error ? error.message : "연동을 만들지 못했습니다."); } })}>연동 생성</button></div>}
      {selected ? <p className="text-xs text-ink/50">허용 origin: {selected.primaryOrigin}</p> : null}
      {message ? <p aria-live="polite" className="text-sm text-brand-red">{message}</p> : null}
      {credential ? <IntegrationKeyDialog credential={credential} onClose={() => setCredential(null)} /> : null}
    </section>
  );
}

export function IntegrationLifecycleManager({
  integration,
}: {
  integration: { id: string; publicId: string; keyVersion: number; status: "ACTIVE" | "DISABLED" };
}) {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [message, setMessage] = useState("");
  const [pending, startTransition] = useTransition();
  const run = (operation: () => Promise<void>) => startTransition(async () => { setMessage(""); try { await operation(); } catch (error) { setMessage(error instanceof Error ? error.message : "처리하지 못했습니다."); } });

  return (
    <section className="grid gap-4 rounded-2xl border border-brand-red/15 bg-brand-red/5 p-5">
      <div><h2 className="font-bold">연동 키·상태 관리</h2><p className="mt-1 text-sm leading-6 text-ink/55">비밀키를 교체하면 기존 비밀키는 즉시 무효가 됩니다. 고객사 서버 환경변수를 새 키로 바꿀 준비가 된 뒤 회전하세요.</p></div>
      <div className="flex flex-wrap gap-3">
        <button type="button" disabled={pending || integration.status !== "ACTIVE"} className="rounded-full border border-brand-red/25 bg-white px-5 py-2.5 font-bold text-brand-red disabled:opacity-50" onClick={() => { if (!window.confirm("기존 비밀키가 즉시 무효화됩니다. 고객사 서버 키를 교체할 준비가 되었나요?")) return; run(async () => { const result = await rotateWidgetIntegration(integration.id); if (!result.ok || !result.secret || !result.keyVersion) throw new Error("키를 회전하지 못했습니다."); setCredential({ publicId: integration.publicId, secret: result.secret, keyVersion: result.keyVersion }); }); }}>비밀키 회전</button>
        <button type="button" disabled={pending} className="rounded-full bg-ink px-5 py-2.5 font-bold text-white disabled:opacity-50" onClick={() => run(async () => { const result = await setWidgetIntegrationEnabled(integration.id, integration.status !== "ACTIVE"); if (!result.ok) throw new Error("상태를 바꾸지 못했습니다."); setMessage(integration.status === "ACTIVE" ? "연동을 비활성화했습니다." : "연동을 활성화했습니다."); })}>{integration.status === "ACTIVE" ? "연동 비활성화" : "연동 활성화"}</button>
      </div>
      {message ? <p aria-live="polite" className="text-sm text-ink/65">{message}</p> : null}
      {credential ? <IntegrationKeyDialog credential={credential} onClose={() => setCredential(null)} /> : null}
    </section>
  );
}
