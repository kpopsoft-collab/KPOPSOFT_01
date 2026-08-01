"use client";

import { useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { type EduReview, eduReviews, eduSectionId } from "@/lib/education-content";
import { cn } from "@/lib/utils";

/**
 * 수강 후기 (수정 요청서 §11).
 *
 * **별점을 뺐다.** §11은 "실제 근거가 있는 경우에만 별점", "5.0을 표시할 경우
 * 후기 수와 산정 기준을 확인, 근거가 불명확하면 별점을 제거"라고 지시한다.
 * 후기 본문은 수강생이 커뮤니티에 직접 남긴 실제 글이지만, 다섯 건에 붙어
 * 있던 5점은 **작성자가 매긴 값이 아니라 우리가 채운 값**이다. 근거 없는
 * 만점 평균은 신뢰를 얻기는커녕 후기 전체를 의심하게 만든다.
 *
 * 데이터의 `rating` 필드는 지우지 않았다 — 실제 평점을 수집하게 되면 그때
 * 이 컴포넌트에서 다시 읽으면 된다.
 *
 * 가로 마키는 데스크톱에서만 돈다. 모바일은 자동 이동 대신 직접 넘기는
 * 스와이프가 우선이다(§11) — 좁은 화면에서 자동으로 흐르는 텍스트는 읽는
 * 속도를 사용자가 통제할 수 없다. Hover·Focus에서 멈추고,
 * `prefers-reduced-motion`에서는 아예 돌지 않는다.
 */
export function Reviews() {
  if (eduReviews.length === 0) return null;

  return (
    <Section
      id={eduSectionId.reviews}
      className="scroll-mt-36 bg-ivory"
      bleed
    >
      <div className="container-editorial">
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
      </div>

      {/*
        마키 트랙. 데스크톱에서는 넘침을 감추고 애니메이션으로 밀고, 모바일에서는
        같은 컨테이너가 그냥 가로 스크롤러가 된다(트랙 애니메이션 없음).
      */}
      <div
        className={cn(
          "group mt-14 overflow-x-auto pb-4 lg:mt-20 md:overflow-hidden",
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
        )}
      >
        <ul
          style={{ ["--marquee-gap" as string]: "1.5rem" }}
          className={cn(
            "flex w-max gap-6 px-4 md:px-6",
            // 60초 한 바퀴 — 읽는 속도를 방해하지 않는 범위(§15).
            "md:animate-[kps-marquee_60s_linear_infinite]",
            // Hover·Focus·Drag에서 정지(§11). focus-within이 있어야 키보드로
            // 카드 안 버튼에 닿았을 때 카드가 도망가지 않는다.
            "md:group-hover:[animation-play-state:paused] md:group-focus-within:[animation-play-state:paused]",
            "motion-reduce:animate-none",
          )}
        >
          {eduReviews.map((review) => (
            <li key={review.id} className="w-[78vw] shrink-0 sm:w-[26rem]">
              <ReviewCard review={review} />
            </li>
          ))}

          {/* 이음매용 두 번째 벌 — 스크린리더는 읽지 않는다. 모바일에서는
              스와이프로 넘기므로 필요 없어 렌더하지 않는다. */}
          {eduReviews.map((review) => (
            <li
              key={`${review.id}-loop`}
              aria-hidden
              className="hidden w-[26rem] shrink-0 md:block"
            >
              <ReviewCard review={review} />
            </li>
          ))}
        </ul>
      </div>
    </Section>
  );
}

/** 접기 전 최대 줄 수 — 이보다 긴 후기에만 더보기가 붙는다(§11). */
const CLAMP_LINES = 6;

function ReviewCard({ review }: { review: EduReview }) {
  const [expanded, setExpanded] = useState(false);

  // 줄 수는 렌더 전에 알 수 없어 글자 수로 가늠한다. 정확한 값이 필요한
  // 곳이 아니라 "더보기를 붙일까" 하나만 정하면 되는 자리다.
  const isLong = review.body.length > 160;

  return (
    <article className="flex h-full flex-col gap-5 rounded-3xl border border-ink/10 bg-white p-8">
      <p
        className={cn(
          "flex-1 text-base leading-relaxed text-ink md:text-lg",
          isLong && !expanded && "line-clamp-6",
        )}
        style={
          isLong && !expanded
            ? { WebkitLineClamp: CLAMP_LINES }
            : undefined
        }
      >
        {review.body}
      </p>

      {isLong ? (
        <button
          type="button"
          onClick={() => setExpanded((prev) => !prev)}
          aria-expanded={expanded}
          className="self-start text-sm font-semibold text-ink/60 underline underline-offset-4 transition-colors outline-none hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
        >
          {expanded ? "접기" : "더보기"}
        </button>
      ) : null}

      <div className="flex flex-wrap items-center gap-2 border-t border-ink/10 pt-5">
        <Tag className="border-transparent bg-ink/10 font-semibold text-ink">
          {review.program}
        </Tag>
        <span className="text-sm font-medium text-ink/65">{review.author}</span>
        <span className="ml-auto text-sm text-ink/45">{review.date}</span>
      </div>
    </article>
  );
}
