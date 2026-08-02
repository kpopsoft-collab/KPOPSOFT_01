"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { sectionId } from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * WHY KPOPSOFT — 차별점 카드 + 인터랙티브 역량 레이더 (docs/신규수정사항).
 *
 * 섹션의 자리는 **핵심 비즈니스와 포트폴리오 사이**다(§1). "무엇을 제공하는가"
 * 다음에 "왜 우리인가"를 말하고, 바로 이어지는 포트폴리오가 그것을 증명하는
 * 순서다. 이전에는 포트폴리오 뒤에 있어서, 증명을 먼저 보여준 뒤에 이유를
 * 설명하는 거꾸로 된 흐름이었다.
 *
 * **레이더는 데이터 차트가 아니다.** 눈금·점수·퍼센트를 어디에도 쓰지 않는다.
 * 다만 정오각형으로 고정하지는 않았다 — 카드를 고르면 관련된 두 축이 바깥으로
 * 뻗고 나머지는 살짝 물러난다(§6·§7). 축 하나만 늘리면 "이것만 잘한다"로
 * 읽히지만, 두 축이 짝으로 움직이면 역량이 함께 작동한다는 인상이 된다.
 * 기본 상태(선택 없음)는 여전히 정오각형이라, 가만히 두면 어느 축도 더 길지
 * 않다.
 *
 * 색은 기존 브랜드 팔레트 안에서만 고른다. Yellow는 아이보리 배경에서 글자로
 * 읽히지 않아 라벨에만 어두운 짝(`brand-yellow-ink`)을 쓴다(docs/디자인.md §2).
 *
 * 접근성 — 그래픽(SVG)은 `aria-hidden`이고, 실제 조작 인터페이스는 오른쪽
 * (모바일에서는 아래) 차별점 카드의 버튼들이다. 그래야 키보드로 셋을 모두
 * 탐색할 수 있고, 스크린리더에도 "그림"이 아니라 의미가 먼저 전달된다.
 */

type Axis = {
  name: string;
  /** 점·스포크에 쓰는 CSS 색 (globals.css의 브랜드 토큰). */
  color: string;
  /**
   * 라벨 글자 색. 밝은 accent(Yellow)는 아이보리 배경에서 글자로 쓰면 읽히지
   * 않아, 같은 계열의 어두운 짝(`brand-yellow-ink`)을 쓴다(docs/디자인.md §2).
   * 생략하면 `color`를 그대로 쓴다.
   */
  labelColor?: string;
};

/**
 * 레이더 5축 (신규수정사항 §5).
 *
 * 이전 축(`Strategy · Design · Technology · AI · Education`)은 핵심 비즈니스
 * 섹션이 이미 말하는 **서비스 분야의 나열**이었다. 같은 내용을 도형으로 한 번
 * 더 보여주는 셈이라 이 섹션이 따로 있을 이유가 약했다. 새 축은 분야가 아니라
 * **고객이 우리를 고르는 기준**이다 — 무엇을 파는지가 아니라 어떻게 해내는지.
 */
const axes: Axis[] = [
  { name: "통합 실행력", color: "var(--color-brand-navy)" },
  { name: "기술 구현력", color: "var(--color-brand-blue)" },
  {
    name: "맞춤 설계",
    color: "var(--color-brand-yellow)",
    labelColor: "var(--color-brand-yellow-ink)",
  },
  { name: "현업 적용성", color: "var(--color-brand-red)" },
  { name: "지속 운영", color: "var(--color-brand-mint)" },
];

type Differentiator = {
  index: string;
  title: string;
  description: string;
  keywords: string[];
  /** 이 카드가 켜질 때 강조할 축 (§6 매핑표). */
  axisIndexes: number[];
  textClass: string;
  borderClass: string;
};

/**
 * 차별점 카드 3장 (§4). 각 카드는 레이더의 두 축과 짝지어져 있다(§6).
 *
 * 세 카드가 다섯 축을 나눠 가지는데, `현업 적용성`은 02와 03이 함께 쓴다 —
 * 겹치는 게 아니라 실제로 두 성격을 잇는 축이라 그렇다. "직접 만들어 봤다"와
 * "쓰이게 만든다"가 만나는 지점이 현업 적용성이다.
 */
const differentiators: Differentiator[] = [
  {
    index: "01",
    title: "한 팀에서 연결되는 실행력",
    description:
      "기획·UX/UI·개발·AI를 하나의 팀에서 연결해 커뮤니케이션 비용을 줄이고 프로젝트의 속도와 완성도를 높입니다.",
    keywords: ["Strategy", "UX/UI", "Development", "AI"],
    axisIndexes: [0, 2],
    textClass: "text-brand-navy",
    borderClass: "border-brand-navy",
  },
  {
    index: "02",
    title: "직접 구현해 본 경험",
    description:
      "웹 서비스, 업무 시스템, AI 자동화 등 다양한 프로젝트를 직접 구축한 경험을 바탕으로 실행 가능한 방법을 제안합니다.",
    keywords: ["Web Service", "Business System", "AI Automation"],
    axisIndexes: [1, 3],
    textClass: "text-brand-blue",
    borderClass: "border-brand-blue",
  },
  {
    index: "03",
    title: "도입 이후의 활용까지",
    description:
      "서비스 구축에서 끝나지 않고 운영 환경과 사용자 교육까지 고려해 기술이 실제 조직과 업무에 정착하도록 돕습니다.",
    keywords: ["Operation", "Adoption", "Education"],
    axisIndexes: [3, 4],
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
  /** 선택(hover/focus/tap)된 **차별점 카드**. null이면 기본 Idle 상태. */
  const [selected, setSelected] = useState<number | null>(null);
  /** 진입 애니메이션을 이미 재생했는지 — 짧은 스크롤마다 반복하지 않는다. */
  const [entered, setEntered] = useState(false);

  const sectionRef = useRef<HTMLDivElement>(null);
  const polygonRef = useRef<SVGPolygonElement>(null);
  const fillRef = useRef<SVGPolygonElement>(null);
  const dotRefs = useRef<(SVGCircleElement | null)[]>([]);
  const spokeRefs = useRef<(SVGLineElement | null)[]>([]);

  /**
   * rAF 루프가 매 프레임 읽는 값 — state로 두면 초당 60회 리렌더가 된다.
   * 렌더 중에 직접 대입하지 않고 effect에서 동기화한다(렌더는 순수해야 한다).
   */
  const selectedRef = useRef<number | null>(null);
  useEffect(() => {
    selectedRef.current = selected;
  }, [selected]);

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
      const activeCard = selectedRef.current;
      // 카드 하나가 두 축을 켠다(§6). 축 하나만 늘리면 오각형이 한쪽으로
      // 뾰족해져 "이 항목만 잘한다"로 읽히는데, 두 축이 함께 뻗으면 역량이
      // 짝을 이뤄 작동한다는 인상이 된다.
      const activeAxes =
        activeCard === null ? null : differentiators[activeCard].axisIndexes;

      for (let i = 0; i < axes.length; i++) {
        const breathe =
          1 +
          amplitude *
            idleRamp *
            Math.sin((elapsed / IDLE_PERIOD_MS[i]) * Math.PI * 2 + IDLE_PHASE[i]);
        const focusScale =
          activeAxes === null
            ? 1
            : activeAxes.includes(i)
              ? SELECTED_SCALE
              : UNSELECTED_SCALE;
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

  const activeCard = selected === null ? null : differentiators[selected];
  const activeAxes = activeCard?.axisIndexes ?? null;
  const isAxisActive = (i: number) => activeAxes?.includes(i) ?? false;

  return (
    <Section id={sectionId.why} className="relative overflow-hidden">
      <div
        ref={sectionRef}
        className="grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14"
      >
        {/*
          ── 왼쪽: 카피 + 레이더 (§8) ──
          제목을 그리드 위로 빼지 않고 왼쪽 컬럼 안에 둔다. 레이더가 제목 바로
          아래 붙어야 "이 도형이 이 문장의 그림"이라는 관계가 성립한다.
          모바일에서는 이 컬럼이 통째로 위에 오므로 §8이 지정한 순서
          (라벨 → 타이틀 → 보조 문구 → 레이더 → 카드)가 그대로 나온다.
        */}
        <div className="lg:col-span-7">
          <Eyebrow dotClassName="bg-brand-red">WHY KPOPSOFT</Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            기획부터 구현, 실제 활용까지
            <br />
            하나의 흐름으로 연결합니다.
          </h2>
          <p className="mt-6 max-w-xl text-body-lg text-ink/70">
            KPOPSOFT는 전략과 디자인, 소프트웨어 개발, AI와 교육을 하나의 팀으로
            연결해 아이디어가 실제 비즈니스 성과로 이어지도록 돕습니다.
          </p>

          <svg
            viewBox={`${VIEW.x} ${VIEW.y} ${VIEW.w} ${VIEW.h}`}
            /* 배경 장식으로 보이지 않을 만큼 크게 둔다(§8). 폭 상한을 걸지
               않고 컬럼을 다 쓴다. */
            className="mx-auto mt-10 h-auto w-full max-w-xl lg:mt-4 lg:max-w-none"
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
              const isActive = isAxisActive(i);
              const dimmed = activeAxes !== null && !isActive;
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
              const isActive = isAxisActive(i);
              const dimmed = activeAxes !== null && !isActive;
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
          ── 오른쪽: 차별점 카드 ── 실제 인터페이스 (§4·§8).
          SVG는 `aria-hidden`이고 조작은 전부 이 버튼들이 받는다. 그래야
          키보드로 셋을 모두 탐색할 수 있고, 스크린리더에도 "그림"이 아니라
          의미가 먼저 전달된다.

          hover(포인터)·focus(키보드)·tap(터치)이 모두 같은 상태를 만든다.
          터치에는 hover가 없어 탭이 곧 선택이고, 한 번 더 누르면 해제된다.
        */}
        <ul className="flex flex-col gap-4 lg:col-span-5 lg:justify-center">
          {differentiators.map((item, i) => {
            const isActive = selected === i;
            return (
              <li key={item.index}>
                <button
                  type="button"
                  aria-pressed={isActive}
                  onMouseEnter={() => setSelected(i)}
                  onMouseLeave={() => setSelected(null)}
                  onFocus={() => setSelected(i)}
                  onBlur={() => setSelected(null)}
                  onClick={() => setSelected(isActive ? null : i)}
                  className={cn(
                    "w-full cursor-pointer rounded-3xl border px-6 py-6 text-left transition-all duration-300 outline-none",
                    "focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-background",
                    isActive
                      ? cn("bg-white", item.borderClass)
                      : "border-ink/12 hover:border-ink/30",
                    // 나머지는 투명도를 낮춰 켜진 카드에 시선을 모은다.
                    selected !== null && !isActive && "opacity-55",
                  )}
                >
                  <p className="flex items-baseline gap-3">
                    <span className="text-eyebrow text-ink/45">
                      {item.index}
                    </span>
                    <span
                      className={cn(
                        "text-lg leading-snug font-extrabold tracking-tight transition-colors md:text-xl",
                        isActive ? item.textClass : "text-ink",
                      )}
                    >
                      {item.title}
                    </span>
                  </p>

                  <p className="mt-3 text-base leading-relaxed text-ink/70">
                    {item.description}
                  </p>

                  {/* 키워드 칩 — 카드가 켜졌을 때만 또렷해진다. 항상 진하면
                      본문보다 먼저 읽혀 카드가 태그 목록처럼 보인다. */}
                  <span className="mt-4 flex flex-wrap gap-2">
                    {item.keywords.map((keyword) => (
                      <span
                        key={keyword}
                        className={cn(
                          "rounded-full border px-3 py-1 text-xs font-semibold transition-colors",
                          isActive
                            ? cn(item.borderClass, item.textClass)
                            : "border-ink/15 text-ink/55",
                        )}
                      >
                        {keyword}
                      </span>
                    ))}
                  </span>
                </button>
              </li>
            );
          })}
        </ul>
      </div>

      {/* 선택된 차별점과 강조 축을 스크린리더에도 알린다. 설명 자체는 카드에
          이미 보이므로 화면에는 중복해서 그리지 않는다. */}
      <p className="sr-only" aria-live="polite">
        {activeCard
          ? `${activeCard.title} — ${activeCard.axisIndexes
              .map((i) => axes[i].name)
              .join(", ")} 역량을 강조합니다.`
          : "차별점을 선택하면 관련 역량이 강조됩니다."}
      </p>
    </Section>
  );
}
