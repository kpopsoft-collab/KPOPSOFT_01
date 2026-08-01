import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { Tag } from "@/components/ui/tag";
import {
  ImageLightbox,
  ImageLightboxContent,
  ImageLightboxTrigger,
} from "@/components/ui/image-lightbox";
import {
  eduCategories,
  eduSectionId,
  type PastProgram,
  pastPrograms,
} from "@/lib/education-content";

/**
 * SECTION 06 — 지난 프로그램 (docs/KPOPSOFT_Education_Page_ver3.md §06).
 *
 * ver3 신설. ver2 "교육 사례"(edu-cases.tsx)의 가로 리스트형 카드 구조를
 * 계승하되, 3분류 배지와 진행 시기를 앞세운다 — 이 섹션의 목적이 "무엇을
 * 해냈는가"보다 "언제 어떤 분류의 교육이 실제로 돌았는가"를 보여주는 데 있다.
 *
 * Desktop은 고정폭 이미지 열 + 정보, Mobile은 이미지 상단형으로 마크업 자체를
 * 바꾼다(데스크톱 행을 좁게 눌러 담지 않는다).
 */
export function PastPrograms() {
  if (pastPrograms.length === 0) return null;

  return (
    <Section id={eduSectionId.pastPrograms} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-yellow">지난 프로그램</Eyebrow>
        <h2 className="text-section mt-6 text-ink">지난 프로그램</h2>
        <p className="mt-6 text-body-lg text-ink/70">
          실제로 진행했던 교육의 기록입니다.
        </p>
      </div>

      <ul className="mt-14 flex flex-col gap-6 lg:mt-20">
        {pastPrograms.map((item) => (
          <li key={item.slug}>
            <ProgramRow item={item} />
          </li>
        ))}
      </ul>
    </Section>
  );
}

function categoryName(item: PastProgram) {
  return eduCategories.find((c) => c.id === item.category)?.shortName ?? "";
}

function ProgramFacts({ item }: { item: PastProgram }) {
  return (
    <>
      <div className="flex flex-wrap items-center gap-2">
        <Tag className="border-ink/15 font-semibold text-ink/75">
          {categoryName(item)}
        </Tag>
        <span className="text-sm font-medium text-ink/50">{item.period}</span>
      </div>

      <h3 className="mt-4 text-xl font-extrabold tracking-tight text-ink md:text-2xl">
        {item.title}
      </h3>
      <p className="mt-3 text-base leading-relaxed text-ink/70">
        {item.summary}
      </p>

      <dl className="mt-5 flex flex-wrap gap-x-8 gap-y-2 text-sm">
        <div className="flex gap-2">
          <dt className="text-ink/45">대상</dt>
          <dd className="font-medium text-ink">
            {item.audience} {item.participants}
          </dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink/45">기간</dt>
          <dd className="font-medium text-ink">{item.duration}</dd>
        </div>
        <div className="flex gap-2">
          <dt className="text-ink/45">결과물</dt>
          <dd className="font-medium text-ink">{item.outcome}</dd>
        </div>
      </dl>
    </>
  );
}

function ProgramCover({ item }: { item: PastProgram }) {
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
          `${item.period} · ${item.title}${
            item.galleryCount > 0 ? ` (외 ${item.galleryCount}장)` : ""
          }`
        }
      />
    </ImageLightbox>
  );
}

function ProgramRow({ item }: { item: PastProgram }) {
  return (
    <article className="overflow-hidden rounded-3xl bg-white">
      {/* Desktop — 가로 리스트형. */}
      <div className="hidden lg:flex lg:items-stretch">
        <div className="w-80 shrink-0">
          <ProgramCover item={item} />
        </div>
        <div className="flex flex-1 flex-col justify-center p-10">
          <ProgramFacts item={item} />
        </div>
      </div>

      {/* Mobile / tablet — 이미지 상단형. */}
      <div className="lg:hidden">
        <ProgramCover item={item} />
        <div className="p-7">
          <ProgramFacts item={item} />
        </div>
      </div>
    </article>
  );
}
