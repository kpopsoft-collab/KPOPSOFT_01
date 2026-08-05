import { Section } from "@/components/layout/section";
import { QuarterCircle, Ring } from "@/components/shapes";
import { eduProcessSteps, eduSectionId } from "@/lib/education-content";
import { accentBg, accentOnDark, type Accent } from "@/lib/site";
import { cn } from "@/lib/utils";

/** Vertical position (percent of diagram height) of each node — a zigzag path. */
const NODE_Y = [18, 82, 18, 82, 18] as const;

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
        size === "lg"
          ? "size-16 text-lg lg:size-20 lg:text-xl"
          : "size-14 text-base",
        accentBg[accent],
        accentOnDark[accent] ? "text-ivory" : "text-ink",
      )}
    >
      {index}
    </div>
  );
}

/**
 * SECTION 09 — 교육 진행 프로세스 (docs §14).
 *
 * Reuses the same zigzag-diagram / vertical-timeline pattern as the home
 * page's Process component (docs/04-design-system/ §6 Process Diagram) — same visual
 * language, education-specific steps (Discover → Design → Practice → Build →
 * Apply) and its own section id, so it doesn't collide with home's Process.
 */
export function EduProcess() {
  return (
    <Section id={eduSectionId.process} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <h2 className="text-section text-ink">
          기업과 참여자의 목표에 맞춰
          <br />
          교육을 설계합니다.
        </h2>
      </div>

      {/* Desktop — zigzag diagram: dashed path threading five overlapping nodes. */}
      <div className="relative mt-20 hidden h-[30rem] lg:block">
        <Ring
          variant="outline"
          className="pointer-events-none absolute -top-12 right-0 size-40 text-ink/5"
        />
        <QuarterCircle className="pointer-events-none absolute bottom-0 left-0 size-32 text-ink/5" />

        <svg
          viewBox="0 0 100 100"
          preserveAspectRatio="none"
          className="absolute inset-0 h-full w-full"
          aria-hidden
        >
          <defs>
            <marker
              id="edu-process-arrow"
              viewBox="0 0 10 10"
              refX="6"
              refY="5"
              markerWidth="4.5"
              markerHeight="4.5"
              orient="auto"
            >
              <path d="M0 0 L10 5 L0 10 Z" fill="var(--color-ink)" opacity="0.4" />
            </marker>
          </defs>
          <path
            d={`M ${NODE_Y.map((y, i) => `${(i + 0.5) * 20} ${y}`).join(" L ")}`}
            fill="none"
            stroke="var(--color-ink)"
            strokeOpacity="0.2"
            strokeWidth="0.6"
            strokeDasharray="1.4 2.4"
            strokeLinecap="round"
            vectorEffect="non-scaling-stroke"
            markerMid="url(#edu-process-arrow)"
            markerEnd="url(#edu-process-arrow)"
          />
        </svg>

        <ol className="contents">
          {eduProcessSteps.map((step, i) => {
            const top = NODE_Y[i];
            const textBelow = top < 50;
            return (
              <li
                key={step.index}
                className="absolute flex w-40 flex-col items-center text-center"
                style={{
                  left: `${(i + 0.5) * 20}%`,
                  top: `${top}%`,
                  transform: "translate(-50%, -50%)",
                }}
              >
                {textBelow ? (
                  <>
                    <ProcessNode index={step.index} accent={step.accent} />
                    <div className="mt-5">
                      <h3 className="text-lg font-extrabold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-base text-ink/70">
                        {step.description}
                      </p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <h3 className="text-lg font-extrabold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-base text-ink/70">
                        {step.description}
                      </p>
                    </div>
                    <ProcessNode index={step.index} accent={step.accent} />
                  </>
                )}
              </li>
            );
          })}
        </ol>
      </div>

      {/* Mobile / tablet — vertical timeline: one spine, steps stacked top to bottom. */}
      <div className="relative mt-14 lg:hidden">
        <div className="absolute top-7 bottom-7 left-7 w-px bg-ink/15" aria-hidden />
        <ol className="flex flex-col gap-10">
          {eduProcessSteps.map((step, i) => (
            <li key={step.index} className="relative flex gap-5">
              <ProcessNode index={step.index} accent={step.accent} size="sm" />
              {i < eduProcessSteps.length - 1 && (
                <span
                  className="pointer-events-none absolute top-full left-7 z-10 flex size-4 -translate-x-1/2 translate-y-3 items-center justify-center rounded-full bg-ivory"
                  aria-hidden
                >
                  <svg viewBox="0 0 10 10" className="size-2 text-ink/50">
                    <path d="M0 0 L10 0 L5 10 Z" fill="currentColor" />
                  </svg>
                </span>
              )}
              <div className="pt-2">
                <h3 className="text-lg font-extrabold text-ink">{step.title}</h3>
                <p className="mt-1.5 text-base text-ink/70">{step.description}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
