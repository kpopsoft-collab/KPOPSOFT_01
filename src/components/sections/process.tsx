import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { QuarterCircle, Ring } from "@/components/shapes";
import {
  accentBg,
  accentOnDark,
  processSteps,
  sectionId,
  type Accent,
} from "@/lib/site";
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
 * Process (docs/디자인.md §6 Process Diagram, §8 PROCESS).
 *
 * Deliberately not a row of five icons. Desktop lays the five steps on a
 * zigzag path: a dashed line threaded through the node circles with
 * arrowheads marking direction, alternating above/below the line so nodes
 * overlap the connector and the whole thing reads as a composed diagram
 * rather than a stepper row. Two faint outline shapes sit behind it for the
 * "overlapping geometric shapes" texture called for in the design doc.
 *
 * Mobile (§11) recomposes into a vertical timeline — a single spine running
 * top to bottom with nodes and copy stacked beside it and small arrows
 * marking flow between steps — not a shrunk copy of the horizontal diagram.
 */
export function Process() {
  return (
    <Section id={sectionId.process} className="relative overflow-hidden">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-blue">진행 방식</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          이해에서 확장까지,
          <br />
          하나의 흐름으로 이어집니다.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          다섯 단계는 각각 끊어진 절차가 아니라, 하나의 선으로 연결된 여정으로
          진행됩니다.
        </p>
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
              id="process-arrow"
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
            markerMid="url(#process-arrow)"
            markerEnd="url(#process-arrow)"
          />
        </svg>

        <ol className="contents">
          {processSteps.map((step, i) => {
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
                      <p className="mt-1.5 text-base text-ink/70">{step.desc}</p>
                    </div>
                  </>
                ) : (
                  <>
                    <div className="mb-5">
                      <h3 className="text-lg font-extrabold text-ink">
                        {step.title}
                      </h3>
                      <p className="mt-1.5 text-base text-ink/70">{step.desc}</p>
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
          {processSteps.map((step, i) => (
            <li key={step.index} className="relative flex gap-5">
              <ProcessNode index={step.index} accent={step.accent} size="sm" />
              {i < processSteps.length - 1 && (
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
                <p className="mt-1.5 text-base text-ink/70">{step.desc}</p>
              </div>
            </li>
          ))}
        </ol>
      </div>
    </Section>
  );
}
