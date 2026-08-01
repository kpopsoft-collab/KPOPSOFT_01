"use client";

import { useEffect, useRef, useState } from "react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { Ring } from "@/components/shapes";
import {
  accentBg,
  accentOnDark,
  processSteps,
  sectionId,
  type Accent,
} from "@/lib/site";
import { cn } from "@/lib/utils";

/**
 * 프로젝트 진행 방식 (4차 수정 요청서 §4).
 *
 * 이전에는 지그재그 다이어그램이었다. 구성 자체는 그림으로서 재미있었지만,
 * 단계가 위아래로 번갈아 놓이면 시선이 매번 되돌아와야 해서 01 → 05라는
 * **순서가 즉시 읽히지 않았다.** 그래서 데스크톱을 수평 타임라인으로 바꿨다 —
 * 한 줄로 흐르는 연결선 위에 번호 원이 얹히고, 그 아래로 영문 단계명과 한글
 * 설명이 같은 리듬으로 반복된다.
 *
 * 연결선은 장식이 아니라 진행 방향을 안내한다(§4). 스크롤 진입 시 왼쪽에서
 * 오른쪽으로 한 번 그려지고, 각 단계가 순서대로 떠오른다. **애니메이션이
 * 끝나면 다섯 단계 모두 같은 명확도로 남는다** — 특정 단계만 계속 진하게
 * 두면 그게 더 중요한 단계라는 잘못된 신호가 되기 때문이다.
 *
 * 모바일(§4)은 세로 타임라인으로 전환한다 — 수평 구성을 축소한 것이 아니라
 * 하나의 세로 축을 따라 단계가 쌓이는 별도 구성이다.
 *
 * 모션은 `prefers-reduced-motion`에서 전부 꺼지고 최종 상태만 남는다.
 */

/** 진입 애니메이션 — 연결선이 그려지는 시간과 단계별 지연. */
const LINE_MS = 900;
const STEP_STAGGER_MS = 110;

function ProcessNode({
  index,
  accent,
  size = "lg",
}: {
  index: string;
  accent: Accent;
  size?: "lg" | "sm";
}) {
  return (
    <div
      className={cn(
        "relative z-10 flex shrink-0 items-center justify-center rounded-full font-extrabold",
        // 요청서 §14/§4: 원형 번호를 키워 진행 순서가 먼저 읽히게 한다.
        size === "lg"
          ? "size-20 text-xl lg:size-24 lg:text-2xl"
          : "size-16 text-lg",
        accentBg[accent],
        accentOnDark[accent] ? "text-ivory" : "text-ink",
        // 번호 원은 연결선 위에 얹힌다 — 선이 원을 관통해 보이지 않도록
        // 배경색 링을 둘러 끊어 준다.
        "ring-8 ring-ivory",
      )}
    >
      {index}
    </div>
  );
}

/**
 * 단계 카피 — 영문 단계명이 1차, 한글 설명이 2차임을 크기·굵기·색으로
 * 분명히 한다(§4: 위계 정리 + 설명의 글자 크기·명암 대비 개선).
 * 데스크톱·모바일이 같은 컴포넌트를 써서 두 레이아웃의 위계가 어긋나지 않는다.
 */
function StepCopy({
  title,
  desc,
  align = "center",
}: {
  title: string;
  desc: string;
  align?: "center" | "left";
}) {
  return (
    <>
      <h3 className="text-xl leading-tight font-extrabold tracking-tight text-ink lg:text-2xl">
        {title}
      </h3>
      <p
        className={cn(
          "mt-2 text-base leading-snug font-medium text-ink/80",
          align === "center" ? "mx-auto max-w-[15rem]" : "",
        )}
      >
        {desc}
      </p>
    </>
  );
}

export function Process() {
  const [entered, setEntered] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);

  // 진입은 한 번만 재생한다 — 짧은 스크롤 이동마다 선이 다시 그려지면
  // 읽는 사람을 방해한다.
  useEffect(() => {
    const el = trackRef.current;
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
      { threshold: 0.2 },
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <Section id={sectionId.process} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">프로젝트 진행 방식</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          비즈니스 니즈의 이해부터
          <br />
          구축과 운영까지
        </h2>
        <p className="mt-6 max-w-2xl text-body-lg text-ink/70">
          고객의 비즈니스 목표와 필요한 기능을 함께 구체화하고, 서비스 설계부터
          개발, 출시와 운영까지 단계적으로 진행합니다.
        </p>
      </div>

      {/* ── 데스크톱 — 수평 타임라인 ───────────────────────────────────── */}
      <div ref={trackRef} className="relative mt-20 hidden lg:block">
        {/* 장식 도형 — 연결선·텍스트와 겹치지 않도록 바깥쪽으로 밀어냈다. */}
        <Ring
          variant="outline"
          className="pointer-events-none absolute -top-24 -right-10 size-40 text-ink/[0.06]"
        />

        {/*
          연결선. 번호 원의 세로 중심(원 지름 96px의 절반 = 48px)에 맞춰 놓고,
          첫 칸과 마지막 칸의 **중심** 사이만 잇는다(5열이므로 10% ~ 90%).
          바탕 트랙 위에 진행 선을 겹쳐, 진행 선만 좌 → 우로 자라게 한다.
          transform(scaleX)만 움직이므로 레이아웃 재계산이 없다.
        */}
        <div
          className="pointer-events-none absolute top-12 right-[10%] left-[10%] h-px -translate-y-1/2 bg-ink/15"
          aria-hidden
        />
        <div
          className={cn(
            "pointer-events-none absolute top-12 right-[10%] left-[10%] h-0.5 origin-left -translate-y-1/2 bg-ink/45",
            "transition-transform ease-out motion-reduce:transition-none",
            entered ? "scale-x-100" : "scale-x-0",
          )}
          style={{ transitionDuration: `${LINE_MS}ms` }}
          aria-hidden
        />

        {/* 진행 방향 화살표 — 원과 원 사이 중간점(20/40/60/80%)에 얹는다. */}
        {[20, 40, 60, 80].map((left, i) => (
          <span
            key={left}
            aria-hidden
            className={cn(
              "pointer-events-none absolute top-12 flex size-5 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full bg-ivory text-ink/55",
              "transition-opacity duration-300 motion-reduce:transition-none",
              entered ? "opacity-100" : "opacity-0",
            )}
            style={{
              left: `${left}%`,
              transitionDelay: `${(LINE_MS / 4) * (i + 1)}ms`,
            }}
          >
            <svg viewBox="0 0 10 10" className="size-2.5">
              <path d="M0 0 L10 5 L0 10 Z" fill="currentColor" />
            </svg>
          </span>
        ))}

        <ol className="relative grid grid-cols-5 gap-6">
          {processSteps.map((step, i) => (
            <li
              key={step.index}
              className={cn(
                "group flex flex-col items-center text-center",
                "transition-[opacity,transform] duration-500 ease-out motion-reduce:transition-none",
                entered
                  ? "translate-y-0 opacity-100"
                  : "translate-y-3 opacity-0",
              )}
              style={{ transitionDelay: `${i * STEP_STAGGER_MS}ms` }}
            >
              <ProcessNode index={step.index} accent={step.accent} />
              {/* hover는 해당 단계의 카피만 살짝 또렷하게 한다 — 나머지를
                  흐리게 만들지는 않는다(§4: 끝난 뒤 동일한 명확도 유지). */}
              <div className="mt-6 transition-transform duration-200 group-hover:-translate-y-0.5">
                <StepCopy title={step.title} desc={step.desc} />
              </div>
            </li>
          ))}
        </ol>
      </div>

      {/* ── 모바일 · 태블릿 — 세로 타임라인 ───────────────────────────── */}
      <div className="relative mt-14 lg:hidden">
        <div
          className="absolute top-8 bottom-8 left-8 w-px bg-ink/25"
          aria-hidden
        />
        <ol className="flex flex-col gap-10">
          {processSteps.map((step, i) => (
            <li key={step.index} className="relative flex gap-5">
              <ProcessNode index={step.index} accent={step.accent} size="sm" />
              {i < processSteps.length - 1 && (
                <span
                  className="pointer-events-none absolute top-full left-8 z-10 flex size-4 -translate-x-1/2 translate-y-3 items-center justify-center rounded-full bg-ivory"
                  aria-hidden
                >
                  <svg viewBox="0 0 10 10" className="size-2 text-ink/55">
                    <path d="M0 0 L10 0 L5 10 Z" fill="currentColor" />
                  </svg>
                </span>
              )}
              <div className="pt-3">
                <StepCopy title={step.title} desc={step.desc} align="left" />
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
