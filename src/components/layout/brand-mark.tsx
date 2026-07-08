import { Circle, Star, Wave } from "@/components/shapes";
import { cn } from "@/lib/utils";

/**
 * KPOPSOFT brandmark — the circle · star · wave trio lockup drawn from the
 * shape system (docs/디자인.md §5), sized to sit inline beside the wordmark in
 * the site header and admin chrome. Purely decorative: the adjacent wordmark
 * carries the accessible name, so this is aria-hidden.
 */
export function BrandMark({ className }: { className?: string }) {
  return (
    <span
      aria-hidden
      className={cn(
        "inline-flex shrink-0 items-center gap-1 align-middle",
        className,
      )}
    >
      <Circle className="size-2.5 text-brand-blue" />
      <Star className="size-3 text-brand-red" />
      <Wave className="h-1.5 w-5 text-brand-mint" />
    </span>
  );
}
