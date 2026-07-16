/**
 * Admin navigation model (docs/어드민기획.md §3).
 * Shared by the desktop sidebar and the mobile drawer so they never drift.
 * `disabled` marks P2/P3 routes not yet built — shown but not linkable.
 */

import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  Newspaper,
  MessageSquareQuote,
  Users,
  BarChart3,
  ListChecks,
  Settings,
  CreditCard,
  Building2,
  FileText,
  ReceiptText,
  type LucideIcon,
} from "lucide-react";

export type AdminNavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
  disabled?: boolean;
};

export type AdminNavGroup = {
  heading: string;
  items: AdminNavItem[];
};

export const adminNav: AdminNavGroup[] = [
  {
    heading: "운영",
    items: [
      { label: "대시보드", href: "/admin", icon: LayoutDashboard },
      { label: "문의", href: "/admin/inquiries", icon: Inbox },
    ],
  },
  {
    heading: "콘텐츠",
    items: [
      { label: "Work", href: "/admin/content/work", icon: Briefcase },
      { label: "Insights", href: "/admin/content/insights", icon: Newspaper },
      { label: "후기", href: "/admin/content/testimonials", icon: MessageSquareQuote },
      { label: "강사진", href: "/admin/content/experts", icon: Users },
      { label: "수치", href: "/admin/content/stats", icon: BarChart3 },
      { label: "문의 옵션", href: "/admin/content/inquiry-options", icon: ListChecks },
    ],
  },
  {
    heading: "결제·계약",
    items: [
      { label: "결제 대시보드", href: "/admin/billing", icon: CreditCard },
      { label: "고객사", href: "/admin/billing/customers", icon: Building2 },
      { label: "계약", href: "/admin/billing/contracts", icon: FileText },
      { label: "청구서", href: "/admin/billing/invoices", icon: ReceiptText },
    ],
  },
  {
    heading: "계정",
    items: [{ label: "설정", href: "/admin/settings", icon: Settings }],
  },
];
