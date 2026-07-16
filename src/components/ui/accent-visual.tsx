import {
  Arch,
  Capsule,
  Circle,
  QuarterCircle,
  Ring,
  Star,
  Wave,
} from "@/components/shapes";
import { accentBg, accentOnDark, type Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Flat brand-shape composition used as an image stand-in (docs/디자인.md §5) —
 * no gray photo placeholders, no gradients. Each accent gets its own pairing
 * from the shape vocabulary so a card reads from shape + copy, not color alone
 * (§12). Shared by Selected Work and Education so both surfaces stay consistent.
 *
 * `monogram`/`label`은 ver2 Placeholder 요건(Education §25 — 도형 + 이름 첫
 * 글자 + 감성 라벨)을 위한 선택 오버레이. 카드 제목을 그대로 되풀이하는
 * 장식이므로 이 블록 전체는 계속 aria-hidden이다.
 */
export function AccentVisual({
  accent,
  monogram,
  label,
  className,
}: {
  accent: Accent;
  monogram?: string;
  label?: string;
  className?: string;
}) {
  const fg = accentOnDark[accent] ? "text-ivory" : "text-ink";

  return (
    <div
      className={cn(
        "relative flex h-40 w-full items-center justify-center overflow-hidden rounded-2xl md:h-28",
        accentBg[accent],
        className,
      )}
      aria-hidden
    >
      {monogram && (
        <span
          className={cn(
            "absolute top-3 left-4 text-3xl font-extrabold tracking-tight opacity-70",
            fg,
          )}
        >
          {monogram}
        </span>
      )}
      {label && (
        <span
          className={cn(
            "text-eyebrow absolute right-4 bottom-3 opacity-70",
            fg,
          )}
        >
          {label}
        </span>
      )}
      {accent === "blue" && (
        <>
          <Arch className={cn("absolute -bottom-7 size-28 opacity-90", fg)} />
          <Circle className={cn("absolute -top-4 -right-4 size-12 opacity-60", fg)} />
        </>
      )}
      {accent === "mint" && (
        <>
          <Wave className={cn("w-32 opacity-90", fg)} />
          <Ring className={cn("absolute -bottom-8 -left-8 size-24 opacity-40", fg)} />
        </>
      )}
      {accent === "red" && (
        <>
          <Star className={cn("size-16 opacity-90", fg)} />
          <QuarterCircle className={cn("absolute -bottom-1 -right-1 size-16 opacity-50", fg)} />
        </>
      )}
      {accent === "yellow" && (
        <>
          <Capsule className={cn("w-24 opacity-90", fg)} />
          <Circle className={cn("absolute -top-6 -left-6 size-14 opacity-50", fg)} />
        </>
      )}
      {accent === "navy" && (
        <>
          <Arch className={cn("absolute -bottom-7 size-28 opacity-90", fg)} />
          <Ring className={cn("absolute -top-4 -right-4 size-12 opacity-50", fg)} />
        </>
      )}
      {accent === "sky" && (
        <>
          <Wave className={cn("w-32 opacity-90", fg)} />
          <Circle className={cn("absolute -top-5 -right-5 size-12 opacity-50", fg)} />
        </>
      )}
      {accent === "coral" && (
        <>
          <Capsule className={cn("w-24 opacity-90", fg)} />
          <Star className={cn("absolute -bottom-3 -right-3 size-12 opacity-50", fg)} />
        </>
      )}
    </div>
  );
}
