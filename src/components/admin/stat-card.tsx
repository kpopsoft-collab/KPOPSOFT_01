import { cn } from "@/lib/utils";

/**
 * Dashboard stat card (docs/어드민기획.md §6 "대시보드").
 * Reused by `/admin` for the inquiry summary. Accent is a subtle background
 * tint + border, matching the status colors used elsewhere in admin
 * (new=blue, in_progress=yellow, done=mint — see lib/admin/types.ts
 * `inquiryStatusAccent`). Value text stays `text-ink` for AA contrast; color
 * carries the accent, not the number itself.
 */

export type StatCardAccent = "neutral" | "blue" | "yellow" | "mint";

const accentClass: Record<StatCardAccent, string> = {
  neutral: "border-border bg-card",
  blue: "border-brand-blue/25 bg-brand-blue/8",
  yellow: "border-brand-yellow/45 bg-brand-yellow/12",
  mint: "border-brand-mint/30 bg-brand-mint/10",
};

const dotClass: Record<StatCardAccent, string> = {
  neutral: "bg-ink/25",
  blue: "bg-brand-blue",
  yellow: "bg-brand-yellow",
  mint: "bg-brand-mint",
};

export function StatCard({
  title,
  value,
  accent = "neutral",
  className,
}: {
  title: string;
  value: number | string;
  accent?: StatCardAccent;
  className?: string;
}) {
  return (
    <div
      className={cn(
        "flex flex-col gap-3 rounded-2xl border p-5",
        accentClass[accent],
        className,
      )}
    >
      <div className="flex items-center gap-2">
        <span
          aria-hidden
          className={cn("size-2 rounded-full", dotClass[accent])}
        />
        <p className="text-sm font-semibold text-ink/55">{title}</p>
      </div>
      <p className="text-3xl font-extrabold tracking-tight text-ink sm:text-4xl">
        {value}
      </p>
    </div>
  );
}
