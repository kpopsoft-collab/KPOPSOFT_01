/**
 * 새 탭으로 여는 외부 링크.
 *
 * 같은 패턴이 네 곳에 복사돼 있었다(과정 상세의 요약 카드·자료 블록·모바일
 * 하단 바, 포트폴리오 상세의 "사이트 방문하기"). 네 곳 모두 아래 세 가지를
 * 똑같이 갖춰야 하는데, 복사본이 흩어져 있으면 하나만 빠뜨려도 알아채기 어렵다.
 *
 *   1. `target="_blank"` + **`rel="noopener noreferrer"`**
 *      — `noopener`가 빠지면 열린 문서가 `window.opener`로 우리 창을 조작할 수
 *        있다. `CtaButton`은 외부 링크에 `noreferrer`만 붙이므로 여기를 쓴다.
 *   2. **`sr-only` 문구** — 새 창에서 열린다는 사실을 아이콘(시각)만으로
 *      알리면 스크린리더 사용자에게는 전달되지 않는다.
 *   3. hover 시 아이콘이 살짝 밀리는 모션 — 모션 스펙의 "튀지 않는 이동".
 *
 * 라벨 뒤에 붙는 안내 문구를 `srSuffix`로 조절할 수 있다. 기본값은
 * `" (새 창에서 열림)"`이고, 라벨이 짧아 동사가 필요한 자리(모바일 바의
 * "상세 자료")에서는 `" 보기 (새 창에서 열림)"`처럼 넘긴다.
 *
 * `icon`은 **아이콘 컴포넌트 자체**를 받는다(엘리먼트가 아니다). 모션·크기
 * 클래스는 여기서만 정하기 위해서다 — 엘리먼트로 받으면 호출부마다 같은
 * `transition-transform group-hover:…`를 다시 적게 되고, 모션 스펙이 여러
 * 곳으로 갈라진다.
 */
import { ArrowUpRight, type LucideIcon } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "@/lib/utils";

const newTabLinkVariants = cva(
  "group inline-flex items-center justify-center gap-2 rounded-full font-semibold whitespace-nowrap transition-colors outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
  {
    variants: {
      variant: {
        primary: "bg-brand-blue text-white hover:bg-brand-navy",
        secondary:
          "border-[1.25px] border-ink/70 text-ink hover:bg-ink hover:text-ivory",
      },
      size: {
        // CtaButton과 같은 높이 — 나란히 놓았을 때 어긋나지 않게 한다.
        default: "h-13 px-7 text-[0.95rem]",
        // 모바일 하단 고정 바용. 탭 타겟 최소 44px는 그대로 지킨다.
        compact: "min-h-11 px-4 text-sm",
      },
    },
    defaultVariants: { variant: "primary", size: "default" },
  },
);

export function NewTabLink({
  href,
  srSuffix = " (새 창에서 열림)",
  icon: Icon = ArrowUpRight,
  variant,
  size,
  className,
  children,
}: {
  href: string;
  /** 라벨 뒤에 숨겨 붙는 안내. 앞 공백을 포함해서 넘긴다. */
  srSuffix?: string;
  /** 기본은 `ArrowUpRight`. 다른 아이콘이 필요한 곳만 컴포넌트를 넘긴다. */
  icon?: LucideIcon;
  className?: string;
  children: React.ReactNode;
} & VariantProps<typeof newTabLinkVariants>) {
  return (
    <a
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={cn(newTabLinkVariants({ variant, size }), className)}
    >
      {children}
      <span className="sr-only">{srSuffix}</span>
      <Icon
        className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
        aria-hidden
      />
    </a>
  );
}
