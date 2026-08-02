/**
 * Admin navigation model (docs/어드민기획.md §3).
 * Shared by the desktop sidebar and the mobile drawer so they never drift.
 * `disabled` marks P2/P3 routes not yet built — shown but not linkable.
 */

import {
  LayoutDashboard,
  Inbox,
  Briefcase,
  LayoutGrid,
  Layers,
  Users,
  BarChart3,
  ListChecks,
  Settings,
  GraduationCap,
  Building2,
  Sparkles,
  UsersRound,
  FolderKanban,
  Star,
  HelpCircle,
  TrendingUp,
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
      { label: "핵심 비즈니스", href: "/admin/content/pillars", icon: LayoutGrid },
      {
        label: "핵심 비즈니스 사례",
        href: "/admin/content/pillar-examples",
        icon: Layers,
      },
      { label: "Work", href: "/admin/content/work", icon: Briefcase },
      { label: "강사진", href: "/admin/content/experts", icon: Users },
      { label: "수치", href: "/admin/content/stats", icon: BarChart3 },
      { label: "문의 옵션", href: "/admin/content/inquiry-options", icon: ListChecks },
    ],
  },
  {
    heading: "Education",
    items: [
      {
        label: "정규 클래스",
        href: "/admin/content/education/regular-classes",
        icon: GraduationCap,
      },
      {
        label: "조직·기업 교육",
        href: "/admin/content/education/org-training",
        icon: Building2,
      },
      {
        label: "클럽 기수",
        href: "/admin/content/education/club-cohorts",
        icon: Sparkles,
      },
      {
        label: "클럽 참여 유형",
        href: "/admin/content/education/club-tiers",
        icon: UsersRound,
      },
      {
        label: "지난 프로그램",
        href: "/admin/content/education/past-programs",
        icon: FolderKanban,
      },
      { label: "수강 후기", href: "/admin/content/education/reviews", icon: Star },
      { label: "FAQ", href: "/admin/content/education/faqs", icon: HelpCircle },
      { label: "교육 성과", href: "/admin/content/education/stats", icon: TrendingUp },
    ],
  },
  {
    heading: "계정",
    items: [{ label: "설정", href: "/admin/settings", icon: Settings }],
  },
];
