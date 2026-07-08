import { cn } from "@/lib/utils";

/**
 * Section wrapper — consistent vertical rhythm + editorial container +
 * a scroll-anchor id. `bleed` opts out of the inner container for
 * full-width bands (colored CTA panels, marquees).
 */
export function Section({
  id,
  className,
  containerClassName,
  bleed = false,
  children,
}: {
  id?: string;
  className?: string;
  containerClassName?: string;
  bleed?: boolean;
  children: React.ReactNode;
}) {
  return (
    <section
      id={id}
      className={cn("section-py scroll-mt-20", className)}
    >
      {bleed ? (
        children
      ) : (
        <div className={cn("container-editorial", containerClassName)}>
          {children}
        </div>
      )}
    </section>
  );
}
