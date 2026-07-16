import Image from "next/image";

import { AccentVisual } from "@/components/ui/accent-visual";
import type { Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 카드/히어로가 쓰는 고정 비율 (Education ver2 §26 — aspect-ratio 지정으로
 *  Layout Shift 방지). Tailwind JIT가 스캔할 수 있도록 완성형 클래스로 둔다. */
const RATIO = {
  "4/3": "aspect-[4/3]",
  "16/9": "aspect-[16/9]",
  "3/2": "aspect-[3/2]",
  "1/1": "aspect-square",
  "3/4": "aspect-[3/4]",
} as const;

export type CoverRatio = keyof typeof RATIO;

/**
 * Cover image slot for Work / Insights / Education (docs/어드민기획.md §4.2).
 * Renders the uploaded Storage image when present, else falls back to the
 * brand-shape `AccentVisual` — matching the "없으면 도형 폴백" rule so the
 * design never shows a gray placeholder.
 *
 * ver2 확장 (Home §4 / Education §25·§26):
 * - `ratio` — 지정하면 비율 고정, 생략하면 기존 높이(h-40/md:h-28) 유지.
 * - `sizes` — 컨텍스트별 반응형 소스 선택. 카드와 Hero의 실제 폭이 다르다.
 * - `priority` — Hero·첫 대표 이미지만 우선 로딩, 나머지는 lazy.
 * - `monogram`/`label` — 이미지가 없을 때 폴백에 얹는 브랜드 Placeholder 정보.
 */
export function CoverVisual({
  accent,
  imageUrl,
  alt = "",
  ratio,
  sizes = "(max-width: 768px) 100vw, 33vw",
  priority = false,
  monogram,
  label,
  className,
}: {
  accent: Accent;
  imageUrl?: string;
  alt?: string;
  ratio?: CoverRatio;
  sizes?: string;
  priority?: boolean;
  monogram?: string;
  label?: string;
  className?: string;
}) {
  /**
   * ratio를 주면 높이는 비율이 결정한다.
   *
   * 폴백 경로의 AccentVisual은 자체 기본 높이(h-40 md:h-28)를 갖는데,
   * height와 aspect-ratio는 서로 다른 CSS 속성이라 twMerge가 aspect-* 로
   * h-* 를 지워주지 못한다. 둘 다 살아남으면 명시적 height가 이겨 비율이
   * 무시되므로, h-auto를 함께 넘겨 같은 속성끼리 충돌시켜 걷어낸다.
   */
  const box = ratio ? RATIO[ratio] : "h-40 md:h-28";
  const resetHeight = ratio ? "h-auto md:h-auto" : undefined;

  if (!imageUrl) {
    return (
      <AccentVisual
        accent={accent}
        monogram={monogram}
        label={label}
        className={cn(resetHeight, box, className)}
      />
    );
  }

  return (
    <div className={cn("relative w-full overflow-hidden rounded-2xl", box, className)}>
      <Image
        src={imageUrl}
        alt={alt}
        fill
        priority={priority}
        className="object-cover"
        sizes={sizes}
      />
    </div>
  );
}
