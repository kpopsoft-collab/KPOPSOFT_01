"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * WHY KPOPSOFT — 인터랙티브 역량 구조도 (수정 요청서 §13).
 *
 * 일반적인 3카드 레이아웃 대신 5축 레이더로 "분리된 역량이 하나로 연결된다"를
 * 보여준다. 중요한 전제: **이건 데이터 차트가 아니다.** 객관적 근거가 없는
 * 점수·퍼센트·순위·눈금은 어디에도 노출하지 않는다(§13). 다섯 축의 기본
 * 반지름이 모두 같은 정오각형인 이유도 그래서다 — 축 길이 차이가 곧 "우리는
 * 여기가 더 강하다"는 측정값으로 읽히기 때문이다. 움직임은 값의 변화가 아니라
 * 역량이 유기적으로 연결되고 발전한다는 브랜드 메시지를 뜻한다.
 *
 * 색은 기존 팔레트 안에서만 고른다(§13). Strategy는 요청서의 "Blue 계열"을
 * Navy로, Design의 "Blue와 Red 사이의 기존 보조 컬러"는 Coral로 확정했다.
 * Education의 "Green"은 새 초록이 아니라 기존 Mint를 가리킨다.
 *
 * 접근성 — 그래픽(SVG)은 `aria-hidden`이고, 실제 조작 인터페이스는 오른쪽(모바일
 * 에서는 아래) 역량 목록의 버튼들이다. 그래야 키보드로 다섯 축을 모두 탐색할 수
 * 있고, 스크린리더에도 "그림"이 아니라 의미와 설명이 먼저 전달된다. 화면에
 * 그려지는 건 장식이고 내용은 목록이 갖는다.
 */

type Axis = {
  index: string;
  name: string;
  description: string;
  /** 점·스포크에 쓰는 CSS 색 (globals.css의 브랜드 토큰). */
  color: string;
  /**
   * 라벨 글자 색. 밝은 accent(Yellow)는 아이보리 배경에서 글자로 쓰면 읽히지
   * 않아, 같은 계열의 어두운 짝(`brand-yellow-ink`)을 쓴다(docs/디자인.md §2).
   * 생략하면 `color`를 그대로 쓴다.
   */
  labelColor?: string;
  /** 목록 항목 강조에 쓰는 Tailwind 클래스. */
  textClass: string;
  borderClass: string;
};

const axes: Axis[] = [
  {
    index: "01",
    name: "Strategy",
    description:
      "아이디어와 비즈니스 목표를 구체적인 실행 방향으로 설계합니다.",
    color: "var(--color-brand-navy)",
    textClass: "text-brand-navy",
    borderClass: "border-brand-navy",
  },
  {
    index: "02",
    name: "Design",
    description:
      "사용자가 이해하고 편리하게 사용할 수 있는 서비스 경험을 설계합니다.",
    color: "var(--color-brand-yellow)",
    labelColor: "var(--color-brand-yellow-ink)",
    textClass: "text-brand-yellow-ink",
    borderClass: "border-brand-yellow",
  },
  {
    index: "03",
    name: "Technology",
    description:
      "아이디어를 안정적으로 작동하는 웹·앱 서비스와 업무 시스템으로 구현합니다.",
    color: "var(--color-brand-blue)",
    textClass: "text-brand-blue",
    borderClass: "border-brand-blue",
  },
  {
    index: "04",
    name: "AI",
    description:
      "기술 시연에 그치지 않고 실제 업무와 서비스에서 활용할 수 있는 AI 솔루션을 구축합니다.",
    color: "var(--color-brand-red)",
    textClass: "text-brand-red",
    borderClass: "border-brand-red",
  },
  {
    index: "05",
    name: "Education",
    description:
      "AI를 이해하는 데서 끝나지 않고 실제 업무에 활용할 수 있도록 실습 중심의 교육을 제공합니다.",
    color: "var(--color-brand-mint)",
    textClass: "text-brand-mint-ink",
    borderClass: "border-brand-mint",
  },
];

// ── 지오메트리 ──────────────────────────────────────────────────────────
const SIZE = 400;
const CENTER = SIZE / 2;
/**
 * viewBox는 도형보다 조금 넓게 잡는다. 좌우 축 라벨(Design / Education)이 축
 * 바깥쪽으로 뻗어서, 400×400에 딱 맞추면 라벨 끝이 잘린다.
 *
 * 여백은 가장 긴 라벨이 들어갈 만큼만 준다 — 넉넉히 잡으면 그만큼 도형이
 * 작게 그려져서, 특히 모바일에서 레이더가 눈에 안 들어온다.
 */
const VIEW = { x: -48, y: -12, w: SIZE + 96, h: SIZE + 24 };
/** 기본 반지름. 라벨이 들어갈 바깥 여백을 남긴다. */
const BASE_R = 132;
/** 격자 링 — 눈금이 아니라 배경 텍스처다. 숫자를 붙이지 않는 이유(§13). */
const RINGS = [0.4, 0.7, 1];

const angleOf = (i: number) => ((i * 72 - 90) * Math.PI) / 180;
const pointAt = (i: number, r: number) => [
  CENTER + r * Math.cos(angleOf(i)),
  CENTER + r * Math.sin(angleOf(i)),
];
const polygonPoints = (radii: number[]) =>
  radii.map((r, i) => pointAt(i, r).join(",")).join(" ");

/** 라벨 위치 — 축 방향 바깥쪽. 좌우 축은 정렬을 바꿔 겹침을 피한다. */
const labelLayout = (i: number) => {
  const [x, y] = pointAt(i, BASE_R + 34);
  const cos = Math.cos(angleOf(i));
  return {
    x,
    y,
    anchor: Math.abs(cos) < 0.2 ? "middle" : cos > 0 ? "start" : "end",
  } as const;
};

// ── 모션 파라미터 ───────────────────────────────────────────────────────
/** 진입 애니메이션 총 길이 (요청서: 1.2~1.6초). */
const ENTRY_MS = 1400;
/** 포인트가 중앙에서 바깥으로 퍼지는 구간. */
const GROW_START = 250;
const GROW_MS = 750;
/** Idle 진폭 — 기본 위치의 ±%. 데스크톱 4.5%, 모바일은 절반 수준. */
const IDLE_AMPLITUDE = 0.045;
const IDLE_AMPLITUDE_MOBILE = 0.022;
/** 축마다 다른 주기(4~6초)와 시작 시점. 다섯이 한꺼번에 숨쉬지 않게 한다. */
const IDLE_PERIOD_MS = [4200, 5200, 4600, 5800, 4900];
const IDLE_PHASE = [0, 1.3, 2.4, 3.6, 4.8];
/** 선택된 축은 바깥으로, 나머지는 살짝 안으로. */
const SELECTED_SCALE = 1.16;
const UNSELECTED_SCALE = 0.93;

const easeOutCubic = (t: number) => 1 - Math.pow(1 - t, 3);
const clamp01 = (t: number) => Math.min(Math.max(t, 0), 1);

export function WhyKpopsoft() {
  /** 선택(hover/focus/tap)된 축. null이면 기본 Idle 상태. */
  const [selected, setSelected] = useState<number | null>(null);
  /** 진입 애니메이션을 이미 재생했는지 — 짧은 스크롤마다 반복하지 않는다. */
  const [entered, setEntered] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);
  const fillRef = useRef<SVGPolygonElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spokeRefs = useRef<(SVGLineElement | null)[]>([]);

  /** rAF 루프가 매 프레임 읽는 값 — state로 두면 초당 60회 리렌더가 된다. */
  const selectedRef = useRef<number | null>(null);
  selectedRef.current = selected;

  // 진입 감지 — 한 번 재생한 뒤에는 observer를 끊는다(§13: 최초 1회만).
  useEffect(() => {
    const el = sectionRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setEntered(true);
            observer.disconnect();
            break;
          }
        }
      },
      { threshold: 0.25 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  /**
   * 모션 루프. SVG 속성을 직접 갱신해 React 리렌더를 타지 않는다 — 저사양
   * 기기에서 프레임이 떨어지지 않게 하기 위한 선택이다(§13 성능).
   *
   * 세 가지 조건에서 아예 돌지 않거나 멈춘다.
   *  1. `prefers-reduced-motion: reduce` — 최종 형태만 그리고 끝낸다.
   *  2. 섹션이 화면 밖 — 반복 애니메이션을 일시 중지한다.
   *  3. 진입 전 — 아직 그릴 게 없다.
   */
  useEffect(() => {
    if (!entered) return;

    const reduceMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    const draw = (radii: number[]) => {
      const points = polygonPoints(radii);
      polygonRef.current?.setAttribute("points", points);
      fillRef.current?.setAttribute("points", points);
      radii.forEach((r, i) => {
        const [x, y] = pointAt(i, r);
        const dot = dotRefs.current[i];
        if (dot) {
          dot.setAttribute("cx", String(x));
          dot.setAttribute("cy", String(y));
        }
        const spoke = spokeRefs.current[i];
        if (spoke) {
          spoke.setAttribute("x2", String(x));
          spoke.setAttribute("y2", String(y));
        }
      });
    };

    // 모션 감소 — 최종 형태만 표시하고 루프를 돌리지 않는다.
    if (reduceMotion) {
      draw(axes.map(() => BASE_R));
      return;
    }

    const amplitude = window.matchMedia("(max-width: 767px)").matches
      ? IDLE_AMPLITUDE_MOBILE
      : IDLE_AMPLITUDE;

    // 화면 밖이면 루프를 멈춘다. 다시 들어오면 이어서 재개한다.
    let visible = true;
    const visibilityObserver = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) visible = entry.isIntersecting;
        if (visible && frame === 0) frame = requestAnimationFrame(tick);
      },
      { threshold: 0 },
    );
    if (sectionRef.current) visibilityObserver.observe(sectionRef.current);

    let frame = 0;
    let start: number | undefined;
    /** 현재 반지름 — 목표값을 향해 매 프레임 조금씩 따라간다. */
    const current = axes.map(() => 0);

    const tick = (now: number) => {
      start ??= now;
      const elapsed = now - start;

      // 1) 진입 — 포인트가 중앙에서 바깥으로 퍼진다.
      const growth = easeOutCubic(clamp01((elapsed - GROW_START) / GROW_MS));
      // 2) Idle — 진입이 끝난 뒤 진폭을 서서히 올려 툭 튀지 않게 한다.
      const idleRamp = clamp01((elapsed - ENTRY_MS) / 600);
      const active = selectedRef.current;

      for (let i = 0; i < axes.length; i++) {
        const breathe =
          1 +
          amplitude *
            idleRamp *
            Math.sin((elapsed / IDLE_PERIOD_MS[i]) * Math.PI * 2 + IDLE_PHASE[i]);
        const focusScale =
          active === null ? 1 : active === i ? SELECTED_SCALE : UNSELECTED_SCALE;
        const target = BASE_R * growth * breathe * focusScale;
        // 선택 전환은 부드럽게 — 갑작스러운 변화나 튀는 easing을 쓰지 않는다.
        current[i] += (target - current[i]) * 0.12;
      }

      draw(current);

      if (visible) {
        frame = requestAnimationFrame(tick);
      } else {
        frame = 0;
        start = now - elapsed; // 재개 시 시간이 점프하지 않게 기준을 유지한다.
      }
    };

    frame = requestAnimationFrame(tick);
    return () => {
      if (frame) cancelAnimationFrame(frame);
      visibilityObserver.disconnect();
    };
  }, [entered]);

  const activeAxis = selected === null ? null : axes[selected];

  return (
    <Section id={sectionId.why} className="relative overflow-hidden">
      {/* 제목은 컨테이너 폭을 다 쓴다 — max-w-2xl에 묶어 두면 첫 줄이 한 번 더
          접혀 의도한 두 줄이 세 줄이 됐다. 본문 단락만 좁게 유지한다. */}
      <div>
        <Eyebrow dotClassName="bg-brand-red">WHY KPOPSOFT</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          기술이 실제로 활용되기까지,
          <br />
          필요한 역량을 연결합니다.
        </h2>
        <p className="mt-6 max-w-2xl text-body-lg text-ink/70">
          전략과 디자인, 소프트웨어와 AI, 교육까지 분리된 영역을 하나의 실행
          과정으로 연결합니다.
        </p>
      </div>

      <div
        ref={sectionRef}
        className="mt-14 grid grid-cols-1 items-center gap-12 lg:mt-20 lg:grid-cols-12 lg:gap-14"
      >
        {/* ── 레이더 그래픽 ── 순수 장식. 내용은 오른쪽 목록이 갖는다. */}
        <div className="lg:col-span-7">
          <svg
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            /* 4차 요청서 §3: 그래픽을 20~30% 키운다. 폭 상한을 걷어 컬럼을
               다 쓰게 했다(576px → 약 745px, +29%). */
            className="mx-auto h-auto w-full"
            aria-hidden
          >
            {/* 1) 축과 격자선 — 가장 먼저 fade-in */}
            <g
              className={cn(
                "transition-opacity duration-500",
                entered ? "opacity-100" : "opacity-0",
              )}
            >
              {RINGS.map((ratio) => (
                <polygon
                  key={ratio}
                  points={polygonPoints(axes.map(() => BASE_R * ratio))}
                  fill="none"
                  stroke="var(--color-ink)"
                  strokeOpacity="0.12"
                  strokeWidth="1"
                />
              ))}
              {axes.map((axis, i) => {
                const [x, y] = pointAt(i, BASE_R);
                return (
                  <line
                    key={axis.name}
                    x1={CENTER}
                    y1={CENTER}
                    x2={x}
                    y2={y}
                    stroke="var(--color-ink)"
                    strokeOpacity="0.12"
                    strokeWidth="1"
                  />
                );
              })}
            </g>

            {/* 4) 내부 면 — 외곽선이 그려진 뒤 채워진다.
                   요청서는 Blue·Red·Green 계열로 채우라고 했지만, 프로젝트
                   디자인 시스템이 그라데이션을 금지하고 있어(CLAUDE.md /
                   docs/디자인.md) 면은 flat Blue 저투명도로 두고 세 계열의
                   색은 각 축의 스포크·포인트·라벨이 담당하게 했다. */}
            <polygon
              ref={fillRef}
              points={polygonPoints(axes.map(() => 0))}
              fill="var(--color-brand-blue)"
              className={cn(
                "transition-opacity duration-500 [transition-delay:900ms]",
                entered ? "opacity-[0.05]" : "opacity-0",
              )}
            />

            {/* 3) 포인트를 잇는 외곽선 — pathLength로 정규화해 순차 생성.
                   굵고 진한 파란 선은 오각형 테두리만 눈에 남아서, 정작 읽혀야
                   할 다섯 축의 색과 라벨을 눌렀다. 얇고 옅게 낮춰 포인트를
                   잇는 보조선 역할만 하게 한다. */}
            <polygon
              ref={polygonRef}
              points={polygonPoints(axes.map(() => 0))}
              fill="none"
              stroke="var(--color-brand-blue)"
              strokeWidth="1.4"
              strokeOpacity="0.4"
              strokeLinejoin="round"
              pathLength={1}
              strokeDasharray="1"
              className={cn(
                "transition-[stroke-dashoffset] duration-700 ease-out [transition-delay:500ms]",
                entered ? "[stroke-dashoffset:0]" : "[stroke-dashoffset:1]",
              )}
            />

            {/* 2) 각 축의 스포크 + 포인트 — 중앙에서 바깥으로 확장 */}
            {axes.map((axis, i) => {
              const isActive = selected === i;
              const dimmed = selected !== null && !isActive;
              return (
                <g
                  key={axis.name}
                  className={cn(
                    "transition-opacity duration-300",
                    dimmed ? "opacity-35" : "opacity-100",
                  )}
                >
                  <line
                    ref={(el) => {
                      spokeRefs.current[i] = el;
                    }}
                    x1={CENTER}
                    y1={CENTER}
                    x2={CENTER}
                    y2={CENTER}
                    stroke={axis.color}
                    strokeWidth={isActive ? 2.5 : 1.5}
                    strokeOpacity={isActive ? 0.9 : 0.45}
                    className="transition-[stroke-width,stroke-opacity] duration-300"
                  />
                  <circle
                    ref={(el) => {
                      dotRefs.current[i] = el;
                    }}
                    cx={CENTER}
                    cy={CENTER}
                    r={isActive ? 9 : 6}
                    fill={axis.color}
                    className="transition-[r] duration-300"
                  />
                </g>
              );
            })}

            {/* 5) 라벨 — 마지막에 순차적으로 나타난다 */}
            {axes.map((axis, i) => {
              const { x, y, anchor } = labelLayout(i);
              const isActive = selected === i;
              const dimmed = selected !== null && !isActive;
              return (
                <text
                  key={axis.name}
                  x={x}
                  y={y}
                  textAnchor={anchor}
                  dominantBaseline="middle"
                  fill={
                    isActive ? (axis.labelColor ?? axis.color) : "var(--color-ink)"
                  }
                  fontSize="15"
                  fontWeight={isActive ? 800 : 600}
                  style={{ transitionDelay: `${1000 + i * 90}ms` }}
                  className={cn(
                    "transition-opacity duration-300",
                    entered ? (dimmed ? "opacity-40" : "opacity-100") : "opacity-0",
                  )}
                >
                  {axis.name}
                </text>
              );
            })}

            {/* 중앙 메시지 — 값이 아니라 방향을 말한다(§13). */}
            <text
              x={CENTER}
              y={CENTER - 9}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-ink)"
              fontSize="15"
              fontWeight="800"
              letterSpacing="1.2"
              className={cn(
                "transition-opacity duration-500 [transition-delay:1100ms]",
                entered ? "opacity-100" : "opacity-0",
              )}
            >
              FROM IDEA
            </text>
            <text
              x={CENTER}
              y={CENTER + 11}
              textAnchor="middle"
              dominantBaseline="middle"
              fill="var(--color-ink)"
              fontSize="15"
              fontWeight="800"
              letterSpacing="1.2"
              className={cn(
                "transition-opacity duration-500 [transition-delay:1100ms]",
                entered ? "opacity-100" : "opacity-0",
              )}
            >
              TO IMPACT
            </text>
          </svg>
        </div>

        {/*
          ── 역량 목록 ── 실제 인터페이스.
          데스크톱에서는 레이더 옆, 모바일에서는 아래에 놓인다(§13 모바일).
          hover(포인터)·focus(키보드)·tap(터치)이 모두 같은 선택 상태를 만든다.
        */}
        <ul className="flex flex-col gap-2.5 lg:col-span-5">
          {axes.map((axis, i) => {
            const isActive = selected === i;
            return (
              <li key={axis.name}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={() => setSelected(i)}
                  onMouseLeave={() => setSelected(null)}
                  onFocus={() => setSelected(i)}
                  onBlur={() => setSelected(null)}
                  onClick={() => setSelected(isActive ? null : i)}
                  className={cn(
                    "w-full cursor-pointer rounded-2xl border px-5 py-4 text-left transition-colors outline-none",
                    "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? cn("bg-white", axis.borderClass)
                      : "border-ink/12 hover:border-ink/30",
                    // 나머지 항목은 투명도를 낮춰 선택된 축에 시선을 모은다.
                    selected !== null && !isActive && "opacity-60",
                  )}
                >
                  {/* 축의 색 점을 항목 앞에 둔다 — 그래픽의 어느 꼭짓점이
                      이 설명에 해당하는지 색으로 바로 이어진다(4차 §3:
                      그래픽과 설명 영역의 관계를 명확히). */}
                  <p className="flex items-baseline gap-2.5">
                    <span
                      aria-hidden
                      className="size-2.5 shrink-0 translate-y-[-1px] rounded-full"
                      style={{ backgroundColor: axis.color }}
                    />
                    <span className="text-eyebrow text-ink/45">
                      {axis.index}
                    </span>
                    <span
                      className={cn(
                        "text-lg font-extrabold tracking-tight md:text-xl",
                        isActive ? axis.textClass : "text-ink",
                      )}
                    >
                      {axis.name}
                    </span>
                  </p>
                  <p className="mt-1.5 text-base leading-relaxed text-ink/70">
                    {axis.description}
                  </p>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 선택된 역량을 스크린리더에도 알린다. 설명 자체는 위 목록에 이미
          보이므로 화면에는 중복해서 그리지 않는다. */}
      <p className="sr-only" aria-live="polite">
        {activeAxis
          ? `${activeAxis.name} — ${activeAxis.description}`
          : "역량을 선택하면 설명이 강조됩니다."}
      </p>
    </Section>
  );
}
