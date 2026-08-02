/**
 * KPOPSOFT reusable shape system (docs/04-design-system/ §5).
 *
 * Flat geometric primitives — no gradients, no shadows. Color is driven by
 * `currentColor`, so set it with a text utility, e.g.:
 *   <Star className="text-brand-red size-16" />
 * Outline variants use `stroke` + `fill="none"` via the `variant` prop.
 *
 * Shapes are meant to be cropped, layered, and pushed partly outside their
 * containers to build poster-like compositions.
 */
import type { SVGProps } from "react";

type ShapeProps = SVGProps<SVGSVGElement> & {
  /** "solid" (default) fills with currentColor, "outline" strokes it. */
  variant?: "solid" | "outline";
};

const base = (variant: ShapeProps["variant"], strokeWidth = 8) =>
  variant === "outline"
    ? { fill: "none", stroke: "currentColor", strokeWidth }
    : { fill: "currentColor" };

/**
 * Unified stroke weight for the line-drawn glyph shapes (Cube, Check,
 * Lightbulb) so icons sit together at one consistent line thickness.
 */
const LINE_STROKE = 6;

/** Circle — connection, people, knowledge. */
export function Circle({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <circle cx="50" cy="50" r={variant === "outline" ? 46 : 50} {...base(variant)} />
    </svg>
  );
}

/** Arch / semicircle — growth, progress, entry point. */
export function Arch({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <path d="M0 100 V50 A50 50 0 0 1 100 50 V100 Z" {...base(variant)} />
    </svg>
  );
}

/** Semicircle (flat side down). */
export function SemiCircle({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 50" aria-hidden focusable="false" {...props}>
      <path d="M0 50 A50 50 0 0 1 100 50 Z" {...base(variant)} />
    </svg>
  );
}

/** Quarter circle — a container-cropping accent. */
export function QuarterCircle({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <path d="M0 0 A100 100 0 0 1 100 100 L0 100 Z" {...base(variant)} />
    </svg>
  );
}

/** Capsule — technology tags, skills, modules. */
export function Capsule({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 120 60" aria-hidden focusable="false" {...props}>
      <rect
        x={variant === "outline" ? 4 : 0}
        y={variant === "outline" ? 4 : 0}
        width={variant === "outline" ? 112 : 120}
        height={variant === "outline" ? 52 : 60}
        rx="30"
        {...base(variant)}
      />
    </svg>
  );
}

/** Star — AI insight, discovery, innovation. Four-point sparkle. */
export function Star({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <path
        d="M50 0 C54 30 70 46 100 50 C70 54 54 70 50 100 C46 70 30 54 0 50 C30 46 46 30 50 0 Z"
        {...base(variant, 6)}
      />
    </svg>
  );
}

/**
 * Wave — iteration, process, continuous learning. Education 사업을 뜻하는
 * 브랜드 심볼이기도 하다.
 *
 * 공식 자산 `public/assets/kpopsoft-wordmark.svg`의 물결 경로를 그대로 옮겼다
 * (헤더 락업의 물결과 같은 도형이어야 한다 — 예전 손그림 사인파는 진폭이 훨씬
 * 가팔라 락업과 눈에 띄게 달랐다). 좌표 재계산으로 인한 왜곡을 피하려고 원본
 * 좌표를 유지하고 viewBox만 경로의 bbox로 잡았다.
 *
 * 원본이 획을 따낸 닫힌 채움 도형이라 stroke 기반 outline 변형이 없다.
 */
export function Wave(props: Omit<ShapeProps, "variant">) {
  return (
    <svg
      viewBox="43.9498 11.0999 32.1 9"
      aria-hidden
      focusable="false"
      {...props}
    >
      <path
        d="M71.2498 18.8999C69.5998 18.8999 68.2498 17.8499 66.7498 15.4499C65.6998 13.7999 64.6498 12.8999 63.7498 12.8999C62.8498 12.8999 61.7998 13.7999 60.7498 15.4499C57.8998 20.0999 54.5998 20.0999 51.7498 15.4499C50.6998 13.7999 49.6498 12.8999 48.7498 12.8999C47.8498 12.8999 46.7998 13.7999 45.7498 15.4499C45.4498 15.8999 44.9998 16.0499 44.5498 15.7499C44.0998 15.4499 43.9498 14.9999 44.2498 14.5499C45.7498 12.2999 47.0998 11.0999 48.7498 11.0999C50.3998 11.0999 51.7498 12.1499 53.2498 14.5499C54.2998 16.1999 55.3498 17.0999 56.2498 17.0999C57.1498 17.0999 58.1998 16.1999 59.2498 14.5499C60.7498 12.2999 62.0998 11.0999 63.7498 11.0999C65.3998 11.0999 66.7498 12.1499 68.2498 14.5499C69.2998 16.1999 70.3498 17.0999 71.2498 17.0999C72.1498 17.0999 73.1998 16.1999 74.2498 14.5499C74.5498 14.0999 74.9998 13.9499 75.4498 14.2499C75.8998 14.5499 76.0498 14.9999 75.7498 15.4499C74.2498 17.6999 72.8998 18.8999 71.2498 18.8999Z"
        fill="currentColor"
      />
    </svg>
  );
}

/**
 * Cube — build, prototype, 3D, modular systems. Isometric.
 * Solid (default) renders three filled facets separated by thin seams (the
 * disc/background color shows through the gaps) so the 3D read survives in a
 * single color; outline renders the classic wireframe.
 */
export function Cube({ variant = "solid", ...props }: ShapeProps) {
  if (variant === "outline") {
    return (
      <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
        <g
          fill="none"
          stroke="currentColor"
          strokeWidth={LINE_STROKE}
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M50 8 L88 29 L88 71 L50 92 L12 71 L12 29 Z" />
          <path d="M50 50 L12 29 M50 50 L88 29 M50 50 L50 92" />
        </g>
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <g fill="currentColor">
        {/* top facet */}
        <path d="M50 9.5 L85.3 29 L50 48.5 L14.7 29 Z" />
        {/* left facet */}
        <path d="M13.3 31.2 L48.7 50.7 L48.7 89.8 L13.3 70.3 Z" />
        {/* right facet */}
        <path d="M86.7 31.2 L86.7 70.3 L51.3 89.8 L51.3 50.7 Z" />
      </g>
    </svg>
  );
}

/** Ring / orbit — experimentation, systems. */
export function Ring(props: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <circle
        cx="50"
        cy="50"
        r="44"
        fill="none"
        stroke="currentColor"
        strokeWidth="8"
      />
    </svg>
  );
}

/** Abstract eye — attention, insight. */
export function Eye(props: ShapeProps) {
  return (
    <svg viewBox="0 0 120 80" aria-hidden focusable="false" {...props}>
      <path
        d="M4 40 C30 4 90 4 116 40 C90 76 30 76 4 40 Z"
        fill="none"
        stroke="currentColor"
        strokeWidth="7"
      />
      <circle cx="60" cy="40" r="16" fill="currentColor" />
    </svg>
  );
}

/**
 * Check — validation, confirmation, done. Solid (default) is a bold
 * round-capped tick that reads as a filled glyph; outline is a thin line.
 */
export function Check({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <path
        d="M24 56 L45 78 L84 30"
        fill="none"
        stroke="currentColor"
        strokeWidth={variant === "outline" ? LINE_STROKE : 15}
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

/**
 * Blocks — build, assembly, shipping. Three front-view layers stacked into a
 * tower that narrows toward the top, reading cleanly as "assembled system"
 * even at icon size. The top layer is near-square while the wider middle and
 * bottom layers stay flat, matching the brand icon set. Solid layers are
 * separated by the disc gap; the outline variant strokes the same three tiers.
 */
export function Blocks({ variant = "solid", ...props }: ShapeProps) {
  const outline = variant === "outline";
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <g
        {...(outline
          ? {
              fill: "none",
              stroke: "currentColor",
              strokeWidth: LINE_STROKE,
              strokeLinejoin: "round",
            }
          : { fill: "currentColor" })}
      >
        {/* top — near-square */}
        <rect x="37" y="8" width="26" height="27" rx="8" />
        {/* middle */}
        <rect x="28" y="42" width="44" height="22" rx="7" />
        {/* bottom — widest */}
        <rect x="18" y="70" width="64" height="22" rx="8" />
      </g>
    </svg>
  );
}

/** Lightbulb — idea, insight, discovery. Solid glass bulb, screw thread, base cap. */
export function Lightbulb(props: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <g fill="currentColor">
        {/* solid glass bulb + neck */}
        <path d="M50 12 C31 12 18 25 18 41 C18 52 26 61 36 66 L36 69 L64 69 L64 66 C74 61 82 52 82 41 C82 25 69 12 50 12 Z" />
        {/* screw thread */}
        <rect x="37" y="72" width="26" height="8" rx="4" />
        {/* base cap */}
        <path d="M42 83 H58 L55 90 Q50 95 45 90 Z" />
      </g>
    </svg>
  );
}

/** Cross / plus — modular grid marker. */
export function Plus({ variant = "solid", ...props }: ShapeProps) {
  return (
    <svg viewBox="0 0 100 100" aria-hidden focusable="false" {...props}>
      <path
        d="M40 0 H60 V40 H100 V60 H60 V100 H40 V60 H0 V40 H40 Z"
        {...base(variant, 6)}
      />
    </svg>
  );
}
