import { CoverVisual } from "@/components/ui/cover-visual";
import type { RegularClassDetail } from "@/lib/education-content";

/**
 * 대표 이미지 (요구사항 §3.2) — `image`가 있을 때만 그린다. 캡션은 있을 때만.
 *
 * 목록 카드와 같은 `CoverVisual`을 재사용한다 — 이미지 로딩·비율·언옵티마이즈
 * 처리를 두 곳에서 따로 구현하면 한쪽만 고쳐지기 쉽다.
 */
export function ProgramDetailImage({
  item,
}: {
  item: RegularClassDetail;
}) {
  if (!item.image) return null;

  return (
    <div className="pt-10 md:pt-14">
      <div className="container-editorial">
        <div className="mx-auto max-w-3xl">
          <CoverVisual
            accent={item.accent}
            imageUrl={item.image.src}
            alt={item.image.alt}
            ratio="16/9"
            sizes="(max-width: 768px) 100vw, 768px"
            unoptimized={item.image.unoptimized}
          />
          {item.image.caption ? (
            <p className="mt-3 text-sm text-ink/55">{item.image.caption}</p>
          ) : null}
        </div>
      </div>
    </div>
  );
}
