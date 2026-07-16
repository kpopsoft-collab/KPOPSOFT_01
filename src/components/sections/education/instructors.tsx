import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import { CoverVisual } from "@/components/ui/cover-visual";
import { TagList } from "@/components/ui/tag";
import { eduSectionId } from "@/lib/education-content";
import type { PublicExpert } from "@/lib/public-content";

/**
 * SECTION 11 — 강사진 (docs §16).
 *
 * Reuses the same `experts` data the home page's Experts section reads
 * (`getPublicExperts()`, passed down from the page — docs §28 "데이터를
 * 페이지마다 중복 등록하지 않는다"), just in the education page's own 3-column
 * card grid instead of home's alternating row list, per §29's "강사진 3열"
 * desktop requirement. "모든 프로필 사진은 같은 비율과 유사한 크롭 스타일을
 * 사용" (§16) — every card uses the same 3:4 `CoverVisual` ratio, real photo
 * or brand-shape Placeholder alike.
 */
export function Instructors({ experts }: { experts: PublicExpert[] }) {
  if (experts.length === 0) return null;

  return (
    <Section id={eduSectionId.instructors} className="bg-ivory">
      <div className="max-w-2xl">
        <Eyebrow dotClassName="bg-brand-navy">INSTRUCTORS</Eyebrow>
        <h2 className="text-section mt-6 text-ink">
          현업에서 직접 만들고
          <br />
          적용해 본 전문가가 함께합니다.
        </h2>
        <p className="mt-6 max-w-xl text-body-lg text-ink/70">
          소프트웨어 개발, AI 자동화, 디지털 프로덕트와 프로토타입 제작
          경험을 바탕으로 실제 프로젝트 중심의 교육을 진행합니다.
        </p>
      </div>

      <div className="mt-14 grid grid-cols-1 gap-6 sm:grid-cols-2 lg:mt-20 lg:grid-cols-3">
        {experts.map((expert) => (
          <article
            key={expert.name}
            className="flex flex-col overflow-hidden rounded-3xl bg-white"
          >
            <CoverVisual
              accent={expert.accent}
              imageUrl={expert.image}
              alt={expert.image ? `${expert.name} 프로필 사진` : ""}
              ratio="3/4"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
              monogram={expert.name.charAt(0)}
              label={expert.role}
              className="rounded-none"
            />
            <div className="flex flex-1 flex-col gap-3 p-6">
              <div>
                <p className="text-lg font-extrabold text-ink">{expert.name}</p>
                <p className="text-sm font-semibold text-ink/60">{expert.role}</p>
              </div>
              <p className="text-sm leading-relaxed text-ink/75">
                &ldquo;{expert.quote}&rdquo;
              </p>
              <TagList tags={[...expert.tags]} className="mt-auto pt-2" />
            </div>
          </article>
        ))}
      </div>
    </Section>
  );
}
