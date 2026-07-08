import Link from "next/link";
import { ArrowRight } from "lucide-react";

import { getAdminData } from "@/lib/admin/data";
import { inquiryStatusLabel } from "@/lib/admin/types";
import { StatCard } from "@/components/admin/stat-card";

/**
 * Admin dashboard (docs/어드민기획.md §6 "대시보드"). Server Component —
 * reads the inquiry summary via the data seam (`getAdminData()`), which
 * today returns the in-memory mock and later swaps to Supabase without this
 * screen changing. Recent-inquiry list / charts are P3 (out of scope here).
 */
export default async function AdminDashboardPage() {
  const stats = await getAdminData().getInquiryStats();

  return (
    <div className="mx-auto flex max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-extrabold tracking-tight text-ink">
          대시보드
        </h1>
        <p className="mt-2 text-sm text-ink/55">
          접수된 문의 현황을 한눈에 확인하세요.
        </p>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-5">
        <StatCard title="전체 문의" value={stats.total} accent="neutral" />
        <StatCard
          title={inquiryStatusLabel.new}
          value={stats.new}
          accent="blue"
        />
        <StatCard
          title={inquiryStatusLabel.in_progress}
          value={stats.in_progress}
          accent="yellow"
        />
        <StatCard
          title={inquiryStatusLabel.done}
          value={stats.done}
          accent="mint"
        />
        <StatCard title="오늘 접수" value={stats.today} accent="neutral" />
      </div>

      <div>
        <Link
          href="/admin/inquiries"
          className="group inline-flex min-h-11 items-center gap-2 rounded-full border border-ink/15 px-5 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue"
        >
          문의 전체 보기
          <ArrowRight
            className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
            aria-hidden
          />
        </Link>
      </div>
    </div>
  );
}
