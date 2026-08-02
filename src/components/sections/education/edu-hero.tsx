"use client";

import { useEffect, useRef, useState } from "react";

import { CtaButton } from "@/components/ui/cta-button";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Wave } from "@/components/shapes";
import { educationSectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * Education Hero (수정 요청서 §4).
 *
 * 카피 왼쪽 / 사진 오른쪽의 열린 편집형 배치. 요청서 §4는 "큰 라운드형
 * 컨테이너"를 말하지만, 흰 박스로 감싸 보니 아이보리 배경 위에 카드 한 장이
 * 얹힌 꼴이라 첫 화면이 좁아 보이고 제목이 네 줄로 접혔다. 라운드는 사진
 * 프레임이 이미 갖고 있으므로 그쪽에 맡기고, 카피는 배경 위에 그대로 둔다
 * (사용자 결정).
 *
 * ver3에서는 히어로가 3분류 소개까지 겸했지만, 그 역할은 이제 바로 아래
 * "교육 목적 선택" 섹션이 가져갔다 — 같은 화면에서 세 갈래를 두 번 제시하면
 * 어느 쪽이 진짜 입구인지 알 수 없다.
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
      const progress = Math.min(Math.max(-rect.top / window.innerHeight, 0), 1);
      const max = window.innerWidth < 768 ? 0.015 : 0.03;
      setZoom(1 + progress * max);
    };

    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <section className="relative overflow-hidden pt-16 pb-24 md:pt-24 md:pb-32">
      <div className="container-editorial">
        <div className="grid grid-cols-1 items-center gap-16 lg:grid-cols-12 lg:gap-10">
          <div className="lg:col-span-7">
            <Reveal show={mounted} delay={0}>
              <Eyebrow dotClassName="bg-brand-mint">KPOPSOFT EDUCATION</Eyebrow>
            </Reveal>

            <Reveal show={mounted} delay={80}>
              {/* 확정 카피가 두 줄로 읽혀야 해서 `text-display`가 아니라
                  긴 헤드라인용 단계를 쓴다. 100px에서는 "실제 업무에
                  적용합니다."가 한 줄에 들어가지 않아 네 줄로 접혔다. */}
              <h1 className="text-display-long mt-6 text-ink">
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

          <Reveal
            show={mounted}
            delay={320}
            className="mx-auto w-full max-w-md lg:col-span-5 lg:mx-0 lg:max-w-none"
          >
            <div ref={frameRef} className="relative">
              {/* 확대는 프레임 안에서만 일어나야 한다 — 넘침을 감추는 층과
                    실제로 커지는 층을 나눠 둔다. */}
              <div className="overflow-hidden rounded-[2rem] shadow-[0_24px_60px_-24px_rgba(41,37,34,0.35)]">
                <div
                  style={{ transform: `scale(${zoom})` }}
                  className="transition-transform duration-300 ease-out will-change-transform"
                >
                  {/* 홈 핵심 비즈니스의 Education 카드와 같은 사진이다
                      (사용자 지시). 보유 사진 중 참가자가 가장 많아 교육
                      현장이라는 사실이 한눈에 읽히고, 홈에서 교육 카드를 보고
                      넘어온 방문자에게 같은 장면이 이어진다. */}
                  <CoverVisual
                    accent="mint"
                    imageUrl="/education/education-lecture-01.jpg"
                    alt="교육 현장 — 강사가 화면을 가리키며 설명하고 수강생들이 각자 노트북으로 따라 하는 강의실"
                    ratio="4/3"
                    priority
                    sizes="(max-width: 1024px) 90vw, 40vw"
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
                {/* 파란 원은 뺐다 — 사진 왼쪽 위 모서리를 덮어 강의실 공간이
                    잘려 보였다. 물결은 사진 아래 여백에 걸쳐 있어 가리는 것이
                    없으므로 남긴다. */}
                <Wave className="absolute -right-6 -bottom-7 w-28 text-brand-mint sm:w-36" />
              </div>
            </div>
          </Reveal>
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
