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
 *
 * 도형 크기는 반드시 컨테이너 비례(%)로 둔다. 고정 px(size-28 등)를 쓰면
 * 이 컴포넌트가 쓰이는 박스가 112px 띠부터 500px 대형 카드까지 편차가 커서,
 * 큰 박스에서는 도형이 사라지고 색 덩어리만 남는다 — §25가 금지하는 "회색
 * 박스"와 다를 바 없어진다.
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
          <Arch className={cn("absolute -bottom-[12%] h-[62%] w-auto opacity-90", fg)} />
          <Circle className={cn("absolute -top-[6%] -right-[4%] h-[22%] w-auto opacity-60", fg)} />
        </>
      )}
      {accent === "mint" && (
        <>
          <Wave className={cn("h-auto w-[58%] opacity-90", fg)} />
          <Ring className={cn("absolute -bottom-[14%] -left-[10%] h-[44%] w-auto opacity-40", fg)} />
        </>
      )}
      {accent === "red" && (
        <>
          <Star className={cn("h-[42%] w-auto opacity-90", fg)} />
          <QuarterCircle className={cn("absolute right-0 -bottom-[2%] h-[34%] w-auto opacity-50", fg)} />
        </>
      )}
      {accent === "yellow" && (
        <>
          <Capsule className={cn("h-auto w-[52%] opacity-90", fg)} />
          <Circle className={cn("absolute -top-[10%] -left-[8%] h-[28%] w-auto opacity-50", fg)} />
        </>
      )}
      {accent === "navy" && (
        <>
          <Arch className={cn("absolute -bottom-[12%] h-[62%] w-auto opacity-90", fg)} />
          <Ring className={cn("absolute -top-[6%] -right-[4%] h-[24%] w-auto opacity-50", fg)} />
        </>
      )}
      {accent === "sky" && (
        <>
          <Wave className={cn("h-auto w-[58%] opacity-90", fg)} />
          <Circle className={cn("absolute -top-[8%] -right-[6%] h-[24%] w-auto opacity-50", fg)} />
        </>
      )}
      {accent === "coral" && (
        <>
          <Capsule className={cn("h-auto w-[52%] opacity-90", fg)} />
          <Star className={cn("absolute -right-[3%] -bottom-[5%] h-[26%] w-auto opacity-50", fg)} />
        </>
      )}
    </div>
  );
}
