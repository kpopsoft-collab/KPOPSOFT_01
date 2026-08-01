"use client";

import { useEffect, useRef, useState } from "react";

import { CtaButton } from "@/components/ui/cta-button";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Circle, Wave } from "@/components/shapes";
import { educationSectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Education Hero (수정 요청서 §4).
 *
 * 큰 라운드형 컨테이너 하나에 카피와 사진을 함께 담는다. ver3에서는 히어로가
 * 3분류 소개까지 겸했지만, 그 역할은 이제 바로 아래 "교육 목적 선택" 섹션이
 * 가져갔다 — 같은 화면에서 세 갈래를 두 번 제시하면 어느 쪽이 진짜 입구인지
 * 알 수 없다.
 *
 * 움직임은 세 가지뿐이고 전부 절제한다(§4·§15).
 *  - 장식 도형이 포인터를 따라 최대 8px. 사진이나 글자는 따라가지 않는다.
 *  - 스크롤에 따라 사진이 최대 1.03배. 그 이상은 사진이 프레임을 넘어
 *    "떠 있는" 인상이 된다.
 *  - 텍스트·CTA·이미지가 순차 등장. 한 번만 재생하고 끝난다.
 *
 * 모바일에서는 포인터 패럴랙스가 애초에 의미가 없고(터치), 확대도 절반으로
 * 줄인다. `prefers-reduced-motion`에서는 셋 다 꺼지고 최종 상태만 남는다.
 */

/** 장식 도형이 포인터를 따라가는 최대 거리(px) — §4의 4~8px 상한. */
const PARALLAX_MAX = 8;

export function EduHero() {
  const [mounted, setMounted] = useState(false);
  const [pointer, setPointer] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);

  const frameRef = useRef<HTMLDivElement>(null);
  const reducedRef = useRef(false);

  useEffect(() => {
    reducedRef.current = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    // 다음 프레임에 켠다. 마운트와 같은 프레임에 상태를 바꾸면 브라우저가
    // 시작 상태를 한 번도 그리지 않아 트랜지션이 통째로 생략되고, 등장
    // 애니메이션이 아예 재생되지 않는다.
    const frame = requestAnimationFrame(() => setMounted(true));
    return () => cancelAnimationFrame(frame);
  }, []);

  // 포인터 패럴랙스. 화면 중심 기준 -1~1로 정규화해 도형에만 적용한다.
  useEffect(() => {
    if (reducedRef.current) return;
    // 정밀 포인터(마우스)가 없는 기기에서는 붙이지 않는다 — 터치에서는
    // 마지막으로 누른 지점에 도형이 멈춰 서서 어긋난 것처럼 보인다.
    if (!window.matchMedia("(pointer: fine)").matches) return;

    const onMove = (event: PointerEvent) => {
      const x = (event.clientX / window.innerWidth - 0.5) * 2;
      const y = (event.clientY / window.innerHeight - 0.5) * 2;
      setPointer({ x, y });
    };

    window.addEventListener("pointermove", onMove, { passive: true });
    return () => window.removeEventListener("pointermove", onMove);
  }, []);

  // 스크롤 확대 — 히어로가 화면을 벗어나는 만큼만 비례해서 키운다.
  useEffect(() => {
    if (reducedRef.current) return;

    const onScroll = () => {
      const frame = frameRef.current;
      if (!frame) return;

      const rect = frame.getBoundingClientRect();
      const progress = Math.min(
        Math.max(-rect.top / window.innerHeight, 0),
        1,
      );
      const max = window.innerWidth < 768 ? 0.015 : 0.03;
      setZoom(1 + progress * max);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="px-4 pt-6 pb-16 md:px-6 md:pt-10 md:pb-24">
      <div className="container-editorial">
        <div className="relative overflow-hidden rounded-[2rem] bg-white px-6 py-14 md:rounded-[2.5rem] md:px-12 md:py-20">
          <div className="grid grid-cols-1 items-center gap-14 lg:grid-cols-12 lg:gap-10">
            <div className="max-w-2xl lg:col-span-6">
              <Reveal show={mounted} delay={0}>
                <Eyebrow dotClassName="bg-brand-mint">
                  KPOPSOFT EDUCATION
                </Eyebrow>
              </Reveal>

              <Reveal show={mounted} delay={80}>
                <h1 className="text-display mt-6 text-ink">
                  AI를 배우고, 만들고,
                  <br />
                  <span className="text-brand-blue">실제 업무에 적용합니다.</span>
                </h1>
              </Reveal>

              <Reveal show={mounted} delay={160}>
                {/* 줄바꿈은 의미 단위로 고정한다 — "강의만 듣는 교육이
                    아닙니다"가 한 호흡으로 먼저 읽혀야 다음 문장이 그 반박으로
                    이어진다. */}
                <p className="mt-7 text-body-lg max-w-[46ch] text-ink/70">
                  강의만 듣는 교육이 아닙니다.
                  <br className="hidden sm:inline" /> 직접 만들고 실습하며, AI를
                  자신의 업무와 프로젝트에 활용할 수 있도록 돕습니다.
                </p>
              </Reveal>

              <Reveal show={mounted} delay={240}>
                <div className="mt-9 flex flex-col gap-4 sm:flex-row sm:items-center">
                  <CtaButton
                    variant="primary"
                    href={`#${educationSectionId.programs}`}
                  >
                    프로그램 보기
                  </CtaButton>
                  <CtaButton
                    variant="secondary"
                    href={`#${educationSectionId.inquiry}`}
                  >
                    교육 문의
                  </CtaButton>
                </div>
              </Reveal>
            </div>

            <Reveal show={mounted} delay={320} className="lg:col-span-6">
              <div ref={frameRef} className="relative">
                <div className="overflow-hidden rounded-[1.75rem]">
                  <div
                    style={{ transform: `scale(${zoom})` }}
                    className="transition-transform duration-300 ease-out will-change-transform"
                  >
                    <CoverVisual
                      accent="mint"
                      imageUrl="/education/education-hero.jpg"
                      alt="KPOPSOFT 교육 현장에서 참가자들이 노트북으로 실습하는 모습"
                      ratio="4/3"
                      priority
                      sizes="(max-width: 1024px) 90vw, 45vw"
                      className="rounded-none"
                    />
                  </div>
                </div>

                {/* 장식 그래픽 — 스크린리더에서 제외한다(§17). */}
                <div
                  aria-hidden
                  className="pointer-events-none absolute inset-0"
                  style={{
                    transform: `translate3d(${pointer.x * PARALLAX_MAX}px, ${
                      pointer.y * PARALLAX_MAX
                    }px, 0)`,
                    transition: "transform 400ms ease-out",
                  }}
                >
                  <Circle className="absolute -top-7 -left-7 size-20 text-brand-blue sm:size-24" />
                  <Wave className="absolute -right-6 -bottom-7 w-28 text-brand-mint sm:w-36" />
                </div>
              </div>
            </Reveal>
          </div>
        </div>
      </div>
    </section>
  );
}

/**
 * 순차 등장 (§4). 마운트 이후에 한 번만 재생한다 — 스크롤할 때마다 다시
 * 나타나면 히어로로 돌아올 때마다 읽던 화면이 사라진다.
 *
 * 서버 렌더 결과에는 이미 최종 상태가 들어 있고(투명도만 CSS로 낮춤),
 * JS가 꺼져 있어도 내용은 그대로 보인다.
 */
function Reveal({
  show,
  delay,
  className,
  children,
}: {
  show: boolean;
  delay: number;
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        "motion-safe:transition-all motion-safe:duration-700 motion-safe:ease-out",
        show
          ? "opacity-100 motion-safe:translate-y-0"
          : "motion-safe:translate-y-3 motion-safe:opacity-0",
        className,
      )}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
