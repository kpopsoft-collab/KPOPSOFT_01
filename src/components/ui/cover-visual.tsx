import Image from "next/image";

import { AccentVisual } from "@/components/ui/accent-visual";
import type { Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Cover image slot for Work / Insights (docs/어드민기획.md §4.2). Renders the
 * uploaded Storage image when present, else falls back to the brand-shape
 * `AccentVisual` — matching the "없으면 도형 폴백" rule so the design never
 * shows a gray placeholder.
 */
export function CoverVisual({
  accent,
  imageUrl,
  alt = "",
  className,
}: {
  accent: Accent;
  imageUrl?: string;
  alt?: string;
  className?: string;
}) {
  if (!imageUrl) return <AccentVisual accent={accent} className={className} />;

  return (
    <div
      className={cn(
        "relative h-40 w-full overflow-hidden rounded-2xl md:h-28",
        className,
      )}
    >
      <Image
        src={imageUrl}
        alt={alt}
        fill
        className="object-cover"
        sizes="(max-width: 768px) 100vw, 33vw"
      />
    </div>
  );
}
