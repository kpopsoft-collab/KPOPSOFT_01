"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Tag } from "@/components/ui/tag";
import { type EduReview, eduSectionId } from "@/lib/education-content";
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
/**
 * 마키 이동 속도(px/초).
 *
 * **한 바퀴 시간이 아니라 속도를 고정한다.** 후기 개수는 어드민에서 늘어날
 * 값이라 상한이 없는데, 한 바퀴를 60초로 못 박으면 후기가 늘어날수록 같은
 * 시간에 더 먼 거리를 지나 글자가 점점 빨리 흘러간다. 속도를 고정하면 개수가
 * 몇이든 읽는 속도가 같다.
 */
const SPEED_PX_PER_SEC = 40;

/** 카드 사이 간격(`gap-6` = 1.5rem). 이동 거리 계산에 그대로 쓰인다. */
const GAP_PX = 24;

export function Reviews({ reviews }: { reviews: EduReview[] }) {
  const viewportRef = useRef<HTMLDivElement>(null);
  const setRef = useRef<HTMLUListElement>(null);

  /** 한 바퀴(= 한 벌 폭 + 간격)에 걸리는 시간(초). */
  const [duration, setDuration] = useState(0);
  /** 한 바퀴에 밀어낼 거리(px). 한 벌 폭 + 간격. */
  const [shift, setShift] = useState(0);
  /**
   * 이어 붙일 벌 수. 화면을 덮고도 한 벌이 더 남아야 이음매에 빈 구간이
   * 생기지 않는다. 예전에는 한 벌이 화면보다 좁으면 아예 멈춰 세웠는데,
   * 후기가 적거나 화면이 넓으면 그대로 정지해 보였다 — 벌 수를 늘려
   * **항상 돈다**.
   */
  const [copies, setCopies] = useState(2);

  useEffect(() => {
    const viewport = viewportRef.current;
    const set = setRef.current;
    if (!viewport || !set) return;

    const measure = () => {
      const setWidth = set.scrollWidth;
      if (setWidth === 0) return;

      const distance = setWidth + GAP_PX;
      setShift(distance);
      setDuration(distance / SPEED_PX_PER_SEC);
      setCopies(Math.max(2, Math.ceil(viewport.clientWidth / distance) + 1));
    };

    measure();

    // 폰트 로드나 화면 회전으로 폭이 바뀌면 다시 잰다.
    const observer = new ResizeObserver(measure);
    observer.observe(set);
    observer.observe(viewport);
    return () => observer.disconnect();
    // 후기가 DB에서 오므로 개수가 바뀌면 한 벌 폭도 바뀐다 — 다시 잰다.
  }, [reviews.length]);

  if (reviews.length === 0) return null;

  return (
    <Section id={eduSectionId.reviews} className="scroll-mt-36 bg-ivory" bleed>
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
        마키 트랙 — 모든 화면에서 끊김 없이 돈다.

        같은 목록을 화면을 덮고도 한 벌이 더 남을 만큼 이어 붙이고, 트랙을
        "한 벌 폭 + 간격"만큼 민 뒤 처음으로 돌아간다. 첫 벌이 빠져나가는
        순간 다음 벌이 정확히 그 자리에 있어 이음매가 보이지 않는다.

        이동 거리를 퍼센트가 아니라 실제 px로 주는 이유 — 벌 수가 화면 폭에
        따라 달라지므로 `-50%` 같은 고정 비율로는 이음매가 어긋난다.

        첫 벌을 뺀 나머지는 `aria-hidden`이라 스크린리더는 후기를 한 번만 읽는다.
      */}
      <div
        ref={viewportRef}
        className="group mt-14 overflow-hidden pb-4 lg:mt-20"
      >
        <div
          style={{
            ["--marquee-shift" as string]: `${shift}px`,
            animationDuration: `${duration}s`,
          }}
          className={cn(
            // 좌우 여백을 두지 않는다 — 마키는 화면 양끝으로 흘러 나가는 편이
            // 자연스럽고, 패딩이 붙으면 이음매 계산도 어긋난다.
            "flex w-max gap-6",
            duration > 0 ? "animate-[kps-marquee-shift_linear_infinite]" : null,
            // Hover·Focus에서 정지(§11). focus-within이 있어야 키보드로 카드
            // 안 버튼(더보기)에 닿았을 때 카드가 도망가지 않는다.
            "group-hover:[animation-play-state:paused] group-focus-within:[animation-play-state:paused]",
            "motion-reduce:animate-none",
          )}
        >
          {Array.from({ length: copies }, (_, copy) => (
            <ul
              key={copy}
              ref={copy === 0 ? setRef : undefined}
              aria-hidden={copy > 0 || undefined}
              className="flex w-max shrink-0 gap-6"
            >
              {reviews.map((review) => (
                <li
                  key={`${review.id}-${copy}`}
                  className="w-[78vw] shrink-0 sm:w-[26rem]"
                >
                  <ReviewCard review={review} />
                </li>
              ))}
            </ul>
          ))}
        </div>
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
