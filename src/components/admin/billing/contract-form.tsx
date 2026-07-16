"use client";

import { useMemo, useState, useTransition } from "react";

import { saveBillingContract } from "@/app/admin/(shell)/billing/actions";
import type { BillingCycle, ContractStatus } from "@/lib/billing/types";

type CustomerOption = { id: string; code: string; name: string };
type SiteOption = { id: string; customerId: string; code: string; name: string };
type ProductOption = { id: string; code: string; name: string };
type ContractItemState = {
  productId: string;
  description: string;
  quantity: number;
  unitSupplyAmount: number;
  vatAmount: number;
};

export type ContractFormInitial = {
  id: string;
  customerId: string;
  siteId: string;
  status: ContractStatus;
  cycle: BillingCycle;
  startDate: string;
  endDate: string | null;
  billingAnchorDay: number;
  nextInvoiceDate: string | null;
  dueDays: number;
  autoRenew: boolean;
  items: ContractItemState[];
};

const fieldClass =
  "min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none focus:border-brand-blue";

export function ContractForm({
  customers,
  sites,
  products,
  initial,
  initialCustomerId,
}: {
  customers: CustomerOption[];
  sites: SiteOption[];
  products: ProductOption[];
  initial?: ContractFormInitial;
  initialCustomerId?: string;
}) {
  const [customerId, setCustomerId] = useState(
    initial?.customerId ?? initialCustomerId ?? customers[0]?.id ?? "",
  );
  const availableSites = useMemo(
    () => sites.filter((site) => site.customerId === customerId),
    [customerId, sites],
  );
  const [siteId, setSiteId] = useState(initial?.siteId ?? "");
  const [cycle, setCycle] = useState<BillingCycle>(initial?.cycle ?? "MONTHLY");
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  const [nextInvoiceDate, setNextInvoiceDate] = useState(
    initial?.nextInvoiceDate ?? "",
  );
  const [billingAnchorDay, setBillingAnchorDay] = useState(
    initial?.billingAnchorDay ?? 1,
  );
  const [dueDays, setDueDays] = useState(initial?.dueDays ?? 7);
  const [autoRenew, setAutoRenew] = useState(initial?.autoRenew ?? false);
  const [items, setItems] = useState<ContractItemState[]>(
    initial?.items ??
      (products[0]
        ? [
            {
              productId: products[0].id,
              description: "",
              quantity: 1,
              unitSupplyAmount: 0,
              vatAmount: 0,
            },
          ]
        : []),
  );
  const [error, setError] = useState("");
  const [pending, startTransition] = useTransition();

  const updateItem = (index: number, patch: Partial<ContractItemState>) =>
    setItems((current) =>
      current.map((item, itemIndex) =>
        itemIndex === index ? { ...item, ...patch } : item,
      ),
    );

  if (customers.length === 0 || products.length === 0) {
    return (
      <div className="rounded-2xl border border-dashed border-ink/20 p-8 text-sm text-ink/60">
        계약을 만들려면 활성 고객사·사이트와 상품이 최소 1개씩 필요합니다.
      </div>
    );
  }

  return (
    <form
      className="grid gap-5"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        startTransition(async () => {
          try {
            await saveBillingContract({
              ...(initial ? { id: initial.id } : {}),
              customerId,
              siteId: siteId || availableSites[0]?.id || "",
              status: initial?.status ?? "DRAFT",
              cycle,
              startDate,
              endDate: endDate || null,
              billingAnchorDay,
              nextInvoiceDate: nextInvoiceDate || null,
              dueDays,
              autoRenew,
              items,
            });
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "계약을 저장하지 못했습니다.",
            );
          }
        });
      }}
    >
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <label className="grid gap-1.5 text-sm font-semibold">
          고객사
          <select
            className={fieldClass}
            value={customerId}
            disabled={Boolean(initial)}
            onChange={(event) => {
              setCustomerId(event.target.value);
              setSiteId("");
            }}
          >
            {customers.map((customer) => (
              <option key={customer.id} value={customer.id}>
                {customer.code} · {customer.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          사이트
          <select
            className={fieldClass}
            value={siteId || availableSites[0]?.id || ""}
            disabled={Boolean(initial)}
            onChange={(event) => setSiteId(event.target.value)}
          >
            {availableSites.map((site) => (
              <option key={site.id} value={site.id}>
                {site.code} · {site.name}
              </option>
            ))}
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          청구 주기
          <select className={fieldClass} value={cycle} onChange={(event) => setCycle(event.target.value as BillingCycle)}>
            <option value="MONTHLY">월간</option>
            <option value="ANNUAL">연간</option>
            <option value="ONE_TIME">일회성</option>
            <option value="MANUAL">수동</option>
          </select>
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          시작일
          <input className={fieldClass} type="date" required value={startDate} onChange={(event) => setStartDate(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          종료일
          <input className={fieldClass} type="date" value={endDate} onChange={(event) => setEndDate(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          다음 청구일
          <input className={fieldClass} type="date" value={nextInvoiceDate} onChange={(event) => setNextInvoiceDate(event.target.value)} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          기준일
          <input className={fieldClass} type="number" min={1} max={31} value={billingAnchorDay} onChange={(event) => setBillingAnchorDay(Number(event.target.value))} />
        </label>
        <label className="grid gap-1.5 text-sm font-semibold">
          납부기한(일)
          <input className={fieldClass} type="number" min={0} max={365} value={dueDays} onChange={(event) => setDueDays(Number(event.target.value))} />
        </label>
        <label className="flex items-end gap-2 pb-3 text-sm font-semibold">
          <input type="checkbox" checked={autoRenew} onChange={(event) => setAutoRenew(event.target.checked)} /> 자동 연장
        </label>
      </div>

      <section className="grid gap-3 rounded-2xl border border-border bg-card p-5">
        <div className="flex items-center justify-between">
          <h2 className="font-bold">계약 항목</h2>
          <button
            type="button"
            className="rounded-full border border-ink/15 px-4 py-2 text-sm font-semibold"
            onClick={() =>
              setItems((current) => [
                ...current,
                {
                  productId: products[0].id,
                  description: "",
                  quantity: 1,
                  unitSupplyAmount: 0,
                  vatAmount: 0,
                },
              ])
            }
          >
            항목 추가
          </button>
        </div>
        {items.map((item, index) => (
          <div key={`${item.productId}-${index}`} className="grid gap-3 rounded-xl bg-ivory p-4 lg:grid-cols-6">
            <select className={fieldClass} value={item.productId} onChange={(event) => updateItem(index, { productId: event.target.value })}>
              {products.map((product) => <option key={product.id} value={product.id}>{product.code} · {product.name}</option>)}
            </select>
            <input className={`${fieldClass} lg:col-span-2`} placeholder="설명" value={item.description} onChange={(event) => updateItem(index, { description: event.target.value })} />
            <input className={fieldClass} type="number" min={1} value={item.quantity} onChange={(event) => updateItem(index, { quantity: Number(event.target.value) })} aria-label="수량" />
            <input className={fieldClass} type="number" min={0} value={item.unitSupplyAmount} onChange={(event) => updateItem(index, { unitSupplyAmount: Number(event.target.value) })} aria-label="단가" />
            <div className="flex gap-2">
              <input className={`${fieldClass} min-w-0 flex-1`} type="number" min={0} value={item.vatAmount} onChange={(event) => updateItem(index, { vatAmount: Number(event.target.value) })} aria-label="부가세" />
              <button type="button" className="text-sm font-bold text-brand-red" onClick={() => setItems((current) => current.filter((_, itemIndex) => itemIndex !== index))}>삭제</button>
            </div>
          </div>
        ))}
      </section>

      {error ? <p className="text-sm font-semibold text-brand-red">{error}</p> : null}
      <button type="submit" disabled={pending || availableSites.length === 0 || items.length === 0} className="w-fit min-h-11 rounded-full bg-brand-blue px-6 font-semibold text-white disabled:opacity-50">
        {pending ? "저장 중…" : initial ? "계약 수정" : "초안 계약 만들기"}
      </button>
    </form>
  );
}
