import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import {
  eduReviews,
  eduSectionId,
  getAverageRating,
} from "@/lib/education-content";

const MAX_RATING = 5;

/**
 * SECTION 07 — 후기 (docs/KPOPSOFT_Education_Page_ver3.md §07).
 *
 * ver3에서 인용문 카드 → **별점 + 리뷰형**으로 바뀌었다. 정제된 기업 인용문이
 * 아니라 실제 수강생이 남긴 짧고 구체적인 리뷰의 톤을 따른다.
 *
 * 별점은 아이콘만으로 두지 않고 `sr-only` 텍스트를 함께 넣는다 — 별 모양은
 * 스크린리더에 아무 의미도 전달하지 못하기 때문이다(ver3 §07, docs/디자인.md 접근성).
 */
export function Reviews() {
  if (eduReviews.length === 0) return null;

  const average = getAverageRating();

  return (
    <Section id={eduSectionId.reviews} className="bg-ivory">
      <div className="flex flex-col gap-8 md:flex-row md:items-end md:justify-between">
        <div className="max-w-2xl">
          <Eyebrow dotClassName="bg-brand-coral">수강 후기</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            직접 만들어 본
            <br />
            사람들의 이야기
          </h2>
          <p className="mt-5 text-base text-ink/65 md:text-lg">
            수업이 끝난 뒤 커뮤니티에 직접 남겨주신 후기를 그대로 옮겼습니다.
          </p>
        </div>

        {/* 평균 별점 요약 (ver3 §07). */}
        <div className="flex items-center gap-4 rounded-3xl bg-ink/5 px-6 py-5">
          <span className="text-4xl font-black text-ink">
            {average.toFixed(1)}
          </span>
          <span className="flex flex-col">
            <Stars rating={Math.round(average)} />
            <span className="mt-1 text-sm font-medium text-ink/65">
              후기 {eduReviews.length}건
            </span>
          </span>
        </div>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20">
        {eduReviews.map((review) => (
          <article
            key={review.id}
            className="flex flex-col gap-5 rounded-3xl border border-ink/10 bg-white p-8"
          >
            <Stars rating={review.rating} />

            <p className="flex-1 text-base leading-relaxed text-ink md:text-lg">
              {review.body}
            </p>

            <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5">
              <Tag className="border-transparent bg-ink/10 font-semibold text-ink">
                {review.program}
              </Tag>
              <span className="text-sm font-medium text-ink/65">
                {review.author}
              </span>
              <span className="ml-auto text-sm text-ink/45">{review.date}</span>
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}

/** 별점 표시. 별은 장식이고, 실제 값은 sr-only 텍스트로 읽힌다. */
function Stars({ rating }: { rating: number }) {
  return (
    <span className="flex items-center gap-0.5">
      <span className="sr-only">{MAX_RATING}점 만점에 {rating}점</span>
      {Array.from({ length: MAX_RATING }, (_, i) => (
        <Star key={i} filled={i < rating} />
      ))}
    </span>
  );
}

function Star({ filled }: { filled: boolean }) {
  return (
    <svg
      viewBox="0 0 20 20"
      className={filled ? "size-5 fill-brand-yellow" : "size-5 fill-ink/15"}
      aria-hidden
    >
      <path d="M10 1.5l2.6 5.3 5.9.9-4.2 4.1 1 5.8L10 14.9 4.7 17.6l1-5.8L1.5 7.7l5.9-.9L10 1.5z" />
    </svg>
  );
}
