import type { ReactNode } from "react";

import { requireAdmin } from "@/lib/admin/auth";
import { AdminSidebar } from "@/components/admin/admin-sidebar";
import { AdminTopbar } from "@/components/admin/admin-topbar";

/**
 * Admin shell (docs/어드민기획.md §3, §6). Server Component guard: unauthenticated
 * requests redirect to /admin/login (dev-bypass returns a session for now).
 * Persistent sidebar on desktop, drawer on mobile.
 */
export default async function AdminShellLayout({
  children,
}: {
  children: ReactNode;
}) {
  const session = await requireAdmin();

  return (
    <div className="flex min-h-dvh bg-ivory text-ink">
      <AdminSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <AdminTopbar email={session.email} />
        <main className="flex-1 px-4 py-6 lg:px-8 lg:py-8">{children}</main>
      </div>
    </div>
  );
}
