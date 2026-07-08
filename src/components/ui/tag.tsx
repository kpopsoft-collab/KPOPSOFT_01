/**
 * Expertise tag (docs/디자인.md §Expertise Tags).
 * 13–15px, padding 8×12, 1px ink border, fully rounded, transparent surface.
 */
import { cn } from "@/lib/utils";

export function Tag({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLSpanElement>) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full border border-ink/25 px-3 py-2 text-[0.8125rem] leading-none font-medium text-ink/80",
        className,
      )}
      {...props}
    >
      {children}
    </span>
  );
}

export function TagList({
  tags,
  className,
}: {
  tags: string[];
  className?: string;
}) {
  return (
    <ul className={cn("flex flex-wrap gap-2", className)}>
      {tags.map((tag) => (
        <li key={tag}>
          <Tag>{tag}</Tag>
        </li>
      ))}
    </ul>
  );
}
