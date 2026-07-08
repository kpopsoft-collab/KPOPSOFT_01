/**
 * Eyebrow label (docs/디자인.md §3) — small uppercase section marker,
 * optionally paired with a small brand-colored shape dot.
 */
import { cn } from "@/lib/utils";

export function Eyebrow({
  className,
  children,
  dotClassName,
  ...props
}: React.HTMLAttributes<HTMLParagraphElement> & { dotClassName?: string }) {
  return (
    <p
      className={cn("text-eyebrow flex items-center gap-2 text-ink/60", className)}
      {...props}
    >
      {dotClassName && (
        <span
          className={cn("inline-block size-2 rounded-full", dotClassName)}
          aria-hidden
        />
      )}
      {children}
    </p>
  );
}
