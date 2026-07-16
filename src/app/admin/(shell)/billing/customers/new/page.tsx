import { CustomerForm } from "@/components/admin/billing/customer-form";
import { requireBillingPageView } from "@/lib/billing/page-auth";

export default async function NewBillingCustomerPage() {
  await requireBillingPageView();
  return <div className="mx-auto flex max-w-4xl flex-col gap-6"><header><h1 className="text-2xl font-extrabold">고객사 등록</h1><p className="mt-1 text-sm text-ink/55">고객사와 첫 관리사이트를 한 번에 등록합니다.</p></header><CustomerForm /></div>;
}
