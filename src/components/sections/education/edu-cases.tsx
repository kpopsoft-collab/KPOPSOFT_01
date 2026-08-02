import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import {
  ImageLightbox,
  ImageLightboxContent,
  ImageLightboxTrigger,
} from "@/components/ui/image-lightbox";
import { eduCases, eduSectionId, type EduCase } from "@/lib/education-content";

/**
 * SECTION 10 — 교육 사례 (docs §15).
 *
 * Desktop uses the "가로 리스트형" (구조 B): a fixed-width photo column
 * beside dense case facts. Mobile switches to "이미지 상단형" (구조 A) — a
 * genuinely different markup, not a squeezed copy of the desktop row (§29,
 * §36 completion condition). No auto-playing carousel (§15); the cover photo
 * opens the same `ImageLightbox` used in 교육 결과물, and a "+N" badge signals
 * there's more in the gallery once one exists (§15 "여러 장인 경우").
 */
export function EduCases() {
  if (eduCases.length === 0) return null;

  return (
    <Section id={eduSectionId.cases} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-yellow">EDUCATION CASES</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          실제 업무 문제를
          <br />
          교육으로 함께 해결했습니다.
        </h2>
      </div>

      <ul className="mt-14 flex flex-col gap-6 lg:mt-20">
        {eduCases.map((item) => (
          <li key={item.slug}>
            <CaseRow item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function CaseFacts({ item }: { item: EduCase }) {
  return (
    <>
      <span className="text-eyebrow text-ink/50">{item.industry}</span>
      <h3 className="mt-2 text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        {item.title}
      </h3>
      <p className="mt-3 text-sm font-semibold text-ink/70">
        {item.audience}
      </p>
      <p className="text-sm text-ink/50">
        {item.duration} · {item.format}
      </p>
      <p className="mt-4 text-sm font-medium text-ink">
        <span className="text-ink/45">주요 과제 · </span>
        {item.task}
      </p>
      <p className="mt-1 text-sm font-medium text-ink">
        <span className="text-ink/45">결과물 · </span>
        {item.outcome}
      </p>
    </>
  );
}

function CaseCover({ item }: { item: EduCase }) {
  const badge = item.galleryCount > 0 && (
    <span
      className="absolute right-3 bottom-3 rounded-full bg-ink/70 px-3 py-1.5 text-xs font-semibold text-ivory"
      aria-hidden
    >
      +{item.galleryCount}
    </span>
  );

  return (
    <ImageLightbox>
      <div className="group relative">
        <ImageLightboxTrigger
          className="block w-full rounded-none outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          aria-label={`${item.title} 사진 확대 보기`}
        >
          <CoverVisual
            accent={item.accent}
            imageUrl={item.coverImage.src}
            alt={item.coverImage.alt}
            ratio="4/3"
            sizes="(max-width: 1024px) 100vw, 22rem"
            className="rounded-none [&_img]:transition-transform [&_img]:duration-300 group-hover:[&_img]:scale-[1.03]"
          />
        </ImageLightboxTrigger>
        {badge}
      </div>
      <ImageLightboxContent
        src={item.coverImage.src}
        alt={item.coverImage.alt}
        caption={
          item.coverImage.caption ??
          `${item.industry} · ${item.title}${
            item.galleryCount > 0 ? ` (외 ${item.galleryCount}장)` : ""
          }`
        }
      />
    </ImageLightbox>
  );
}

function CaseRow({ item }: { item: EduCase }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white">
      {/* Desktop — 가로 리스트형: 고정폭 이미지 열 + 정보. */}
      <div className="hidden lg:flex lg:items-stretch">
        <div className="w-80 shrink-0">
          <CaseCover item={item} />
        </div>
        <div className="flex flex-1 flex-col justify-center p-10">
          <CaseFacts item={item} />
        </div>
      </div>

      {/* Mobile / tablet — 이미지 상단형. */}
      <div className="lg:hidden">
        <CaseCover item={item} />
        <div className="p-7">
          <CaseFacts item={item} />
        </div>
      </div>
    </article>
  );
}
