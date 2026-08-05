import { CoverVisual } from "@/components/ui/cover-visual";
import type { RegularClassDetail } from "@/lib/education-content";

/**
 * 대표 이미지 (요구사항 §3.2) — `image`가 있을 때만 그린다. 캡션은 있을 때만.
 *
 * 목록 카드와 같은 `CoverVisual`을 재사용한다 — 이미지 로딩·비율·언옵티마이즈
 * 처리를 두 곳에서 따로 구현하면 한쪽만 고쳐지기 쉽다.
 *
 * ⚠️ 자체 컨테이너(`container-editorial`)도 폭 상한(`max-w-3xl`)도 갖지
 * 않는다. 본문 컬럼 안에 들어가 **부모 폭을 그대로 따른다**(백로그 06
 * 03-화면구조-결정.md §2 ④). 예전에는 히어로가 1280px인데 이미지만 768px로
 * 고정돼 있어서, 히어로가 끝나는 지점에서 화면이 갑자기 좁아졌다.
 */
export function ProgramDetailImage({ item }: { item: RegularClassDetail }) {
  if (!item.image) return null;

  return (
    <figure>
      <CoverVisual
        accent={item.accent}
        imageUrl={item.image.src}
        alt={item.image.alt}
        ratio="16/9"
        // 2단 레이아웃의 본문 컬럼은 1440 뷰포트에서 약 720px다.
        sizes="(max-width: 1024px) 100vw, 720px"
        unoptimized={item.image.unoptimized}
      />
      {item.image.caption ? (
        <figcaption className="mt-3 text-sm text-ink/55">
          {item.image.caption}
        </figcaption>
      ) : null}
    </figure>
  );
}
