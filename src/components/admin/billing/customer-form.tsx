"use client";

import { useState, useTransition } from "react";
import Link from "next/link";

import { createBillingCustomer } from "@/app/admin/(shell)/billing/actions";

const fieldClass =
  "min-h-11 rounded-xl border border-ink/15 bg-white px-3 text-sm outline-none transition focus:border-brand-blue";

export function CustomerForm() {
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState("");
  const [receivesBilling, setReceivesBilling] = useState(true);

  return (
    <form
      className="grid gap-6"
      onSubmit={(event) => {
        event.preventDefault();
        setError("");
        const form = new FormData(event.currentTarget);
        startTransition(async () => {
          try {
            await createBillingCustomer({
              customer: {
                code: String(form.get("customerCode") ?? ""),
                name: String(form.get("customerName") ?? ""),
                businessNumber:
                  String(form.get("businessNumber") ?? "").trim() || null,
                representativeName: String(
                  form.get("representativeName") ?? "",
                ),
                taxEmail: String(form.get("taxEmail") ?? "").trim() || null,
              },
              site: {
                code: String(form.get("siteCode") ?? ""),
                name: String(form.get("siteName") ?? ""),
                primaryOrigin: String(form.get("primaryOrigin") ?? ""),
              },
              contact: String(form.get("contactEmail") ?? "").trim()
                ? {
                    name: String(form.get("contactName") ?? ""),
                    email: String(form.get("contactEmail") ?? ""),
                    phone: String(form.get("contactPhone") ?? ""),
                    receivesBilling,
                  }
                : null,
            });
          } catch (caught) {
            setError(
              caught instanceof Error
                ? caught.message
                : "고객사를 저장하지 못했습니다.",
            );
          }
        });
      }}
    >
      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-ink">고객사</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            고객사 코드
            <input className={fieldClass} name="customerCode" required placeholder="ACME" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            상호
            <input className={fieldClass} name="customerName" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            사업자번호
            <input className={fieldClass} name="businessNumber" placeholder="123-45-67890" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            대표자
            <input className={fieldClass} name="representativeName" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
            세금계산서 이메일(보관용)
            <input className={fieldClass} name="taxEmail" type="email" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-ink">첫 관리사이트</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            사이트 코드
            <input className={fieldClass} name="siteCode" required placeholder="ACME_PORTAL" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            사이트명
            <input className={fieldClass} name="siteName" required />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold sm:col-span-2">
            HTTPS Origin
            <input className={fieldClass} name="primaryOrigin" required placeholder="https://admin.example.com" />
          </label>
        </div>
      </section>

      <section className="grid gap-4 rounded-2xl border border-border bg-card p-5">
        <h2 className="font-bold text-ink">청구 담당자(선택)</h2>
        <div className="grid gap-4 sm:grid-cols-2">
          <label className="grid gap-1.5 text-sm font-semibold">
            이름
            <input className={fieldClass} name="contactName" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            이메일
            <input className={fieldClass} name="contactEmail" type="email" />
          </label>
          <label className="grid gap-1.5 text-sm font-semibold">
            전화번호
            <input className={fieldClass} name="contactPhone" />
          </label>
          <label className="flex items-center gap-2 self-end pb-3 text-sm font-semibold">
            <input
              type="checkbox"
              checked={receivesBilling}
              onChange={(event) => setReceivesBilling(event.target.checked)}
            />
            청구 이메일 수신
          </label>
        </div>
      </section>

      {error ? <p className="text-sm font-semibold text-brand-red">{error}</p> : null}
      <div className="flex gap-3">
        <button
          type="submit"
          disabled={pending}
          className="min-h-11 rounded-full bg-brand-blue px-6 font-semibold text-white disabled:opacity-50"
        >
          {pending ? "저장 중…" : "고객사 저장"}
        </button>
        <Link className="min-h-11 rounded-full border border-ink/15 px-6 py-2.5 font-semibold" href="/admin/billing/customers">
          취소
        </Link>
      </div>
    </form>
  );
}
