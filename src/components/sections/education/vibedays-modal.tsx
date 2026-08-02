"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { ArrowUpRight, Check } from "lucide-react";

import {
  Modal,
  ModalContent,
  ModalDescription,
  ModalTitle,
  ModalTrigger,
} from "@/components/ui/modal";
import { Tag } from "@/components/ui/tag";
import {
  type ClubCohort,
  type ClubTier,
  clubIntro,
  clubOperation,
  cohortStatusLabel,
  getActiveCohort,
  getUpcomingCohorts,
} from "@/lib/education-content";
import { accentBg, accentTint } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 홈 Contact 등 외부에서 이 모달을 열 때 쓰는 해시. */
export const VIBEDAYS_HASH = "#program-club";

/**
 * 바이브데이즈 랜딩 모달 (docs/03-education/ §05.3).
 *
 * ver2에서는 독립 섹션이었지만 ver3에서 모달로 바뀌었다. Esc/배경 클릭 닫기,
 * 포커스 트랩, 배경 스크롤 잠금은 `ui/modal.tsx`가 감싼 base-ui Dialog가
 * 처리한다.
 *
 * 모집 정보는 `CohortStatus`와 기수별 `show` 토글만 보고 그린다 — 마감·연기
 * 때 문구를 고치는 게 아니라 데이터의 상태값 하나만 바꾸면 되도록.
 */
export function VibedaysModal({
  cohorts,
  tiers,
  children,
}: {
  cohorts: ClubCohort[];
  tiers: ClubTier[];
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(false);

  const active = getActiveCohort(cohorts);
  const upcoming = getUpcomingCohorts(cohorts);

  // 홈 Contact의 "지식 공유 커뮤니티 클럽" 링크(`/education#program-club`)로
  // 들어온 경우 모달을 자동으로 연다. 해시로 도착한 뒤에도 뒤로가기가 정상
  // 동작하도록 히스토리는 건드리지 않는다.
  useEffect(() => {
    if (window.location.hash === VIBEDAYS_HASH) setOpen(true);

    const onHashChange = () => {
      if (window.location.hash === VIBEDAYS_HASH) setOpen(true);
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  return (
    <Modal open={open} onOpenChange={setOpen}>
      <ModalTrigger render={children as React.ReactElement} />

      <ModalContent aria-label="바이브데이즈 클럽 안내">
        {/* 헤드 — 16:9 박스에 `object-cover`로 채우면 2.4:1 가로형 키비주얼이
            크게 확대되면서 터미널 글자와 캐릭터가 잘려 나간다. 원본 비율
            그대로 놓아 전체가 보이게 한다. SVG라 옵티마이저는 태우지 않는다. */}
        {/* `shrink-0` 필수 — 팝업이 flex 컬럼이라 내용이 길면 이 블록이
            납작하게 눌려 이미지가 사라진다. */}
        <div className="shrink-0 overflow-hidden sm:rounded-t-[2rem]">
          <Image
            src={clubIntro.image.src}
            alt={clubIntro.image.alt}
            width={1469}
            height={607}
            unoptimized
            className="h-auto w-full"
          />
        </div>

        <div className="flex flex-col gap-10 p-6 pb-10 md:p-10">
          <header className="flex flex-col gap-3">
            <span className="text-eyebrow text-ink/50">
              {clubIntro.eyebrow}
            </span>
            <ModalTitle>{clubIntro.headline}</ModalTitle>
            <ModalDescription>{clubIntro.subheadline}</ModalDescription>
            <p className="mt-2 text-lg leading-snug font-bold whitespace-pre-line text-ink">
              {clubIntro.tagline}
            </p>
          </header>

          {/* 참여 유형 3단계 */}
          <section className="flex flex-col gap-4">
            {/* 카드 세 장을 원색으로 꽉 채우면 색이 서로 부딪혀 정작 글이
                안 읽힌다. 배경은 옅은 톤으로 물린다.
                글자에는 accent를 쓰지 않는다 — 노랑·민트는 옅은 배경 위에서
                AA를 못 넘긴다(§접근성). 색은 왼쪽 막대와 캐릭터에만 남기고,
                이건 이름이 글로 이미 적혀 있으므로 장식으로만 기능한다. */}
            {tiers.map((tier) => (
              <article
                key={tier.name}
                className={cn(
                  "flex items-start gap-4 rounded-3xl p-6 text-ink",
                  accentTint[tier.accent],
                )}
              >
                <span
                  className={cn(
                    "mt-1 h-14 w-1.5 shrink-0 rounded-full",
                    accentBg[tier.accent],
                  )}
                  aria-hidden
                />

                <div className="min-w-0 flex-1">
                  <h3 className="text-lg font-extrabold tracking-tight text-ink">
                    {tier.name}
                  </h3>
                  <p className="mt-1 text-sm font-semibold text-ink/70">
                    {tier.role}
                  </p>
                  <ul className="mt-4 flex flex-col gap-2">
                    {tier.points.map((point) => (
                      <li
                        key={point}
                        className="flex items-start gap-2 text-sm text-ink/80"
                      >
                        <Check
                          className="mt-0.5 size-4 shrink-0 text-ink/45"
                          aria-hidden
                        />
                        <span>{point}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* 유형별 캐릭터. 이름을 이미 글로 밝히고 있으므로 장식으로
                    두고 alt를 비운다. SVG는 next/image 옵티마이저가 거부하므로
                    `unoptimized`로 원본을 그대로 내보낸다. */}
                <Image
                  src={tier.character.src}
                  alt=""
                  width={tier.character.width}
                  height={tier.character.height}
                  unoptimized
                  className="h-24 w-auto shrink-0 self-end sm:h-28"
                />
              </article>
            ))}
          </section>

          {/* 모집 정보 — 노출할 기수가 없으면 이 블록만 비고 모달은 유지된다. */}
          {active ? (
            <CohortBlock cohort={active} />
          ) : (
            <p className="rounded-3xl border border-ink/10 bg-white p-6 text-sm text-ink/65">
              다음 기수 모집 일정은 준비되는 대로 안내드립니다.
            </p>
          )}

          {/* 운영 방식 — 기수와 무관하게 유지되는 내용. */}
          <section className="flex flex-col gap-4">
            <h3 className="text-eyebrow text-ink/50">이렇게 진행합니다</h3>
            <ul className="flex flex-col gap-3">
              {clubOperation.points.map((point) => (
                <li
                  key={point}
                  className="flex items-start gap-3 text-sm leading-relaxed text-ink/75"
                >
                  <span
                    className="mt-1.5 size-1.5 shrink-0 rounded-full bg-brand-mint"
                    aria-hidden
                  />
                  <span>{point}</span>
                </li>
              ))}
            </ul>
          </section>

          {/* 예정 기수 */}
          {upcoming.length > 0 && (
            <section className="flex flex-col gap-3">
              <h3 className="text-eyebrow text-ink/50">다음 기수</h3>
              <ul className="flex flex-wrap gap-2">
                {upcoming.map((cohort) => (
                  <li key={cohort.id}>
                    <Tag className="border-ink/15 bg-white font-medium text-ink/70">
                      {cohort.label} · {cohort.runPeriod}
                    </Tag>
                  </li>
                ))}
              </ul>
            </section>
          )}

          <p className="border-t border-ink/10 pt-8 text-lg leading-snug font-bold whitespace-pre-line text-ink">
            {clubIntro.closing}
          </p>
        </div>
      </ModalContent>
    </Modal>
  );
}

/**
 * 현재 기수 블록.
 *
 * `closed`일 때 신청 버튼을 지우지 않고 비활성 + 사유를 함께 둔다 — 버튼이
 * 사라지면 "마감됐다"는 사실 자체가 전달되지 않기 때문이다(ver3 노출 제어 요구사항).
 */
function CohortBlock({ cohort }: { cohort: ClubCohort }) {
  const isOpen = cohort.status === "open";
  const isClosed = cohort.status === "closed";

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-ink/10 bg-white p-6">
      <div className="flex flex-wrap items-center gap-3">
        <span className="text-xl font-extrabold tracking-tight text-ink">
          {cohort.label}
        </span>
        <Tag
          className={cn(
            "border-transparent font-semibold",
            isOpen && "bg-brand-blue text-white",
            cohort.status === "upcoming" && "bg-ink/80 text-ivory",
            isClosed && "bg-ink/30 text-ivory",
          )}
        >
          {cohortStatusLabel[cohort.status]}
        </Tag>
      </div>

      <dl className="grid grid-cols-1 gap-4 text-sm sm:grid-cols-3">
        {cohort.show.schedule && (
          <>
            <div>
              <dt className="text-ink/45">모집 기간</dt>
              <dd className="mt-1 font-semibold text-ink">
                {cohort.recruitPeriod}
              </dd>
            </div>
            <div>
              <dt className="text-ink/45">운영 기간</dt>
              <dd className="mt-1 font-semibold text-ink">
                {cohort.runPeriod}
              </dd>
            </div>
          </>
        )}
        {cohort.show.price && cohort.price && (
          <div>
            <dt className="text-ink/45">참가비</dt>
            <dd className="mt-1 flex flex-wrap items-baseline gap-2 font-semibold text-ink">
              {/* 정가는 취소선으로 앞에 둔다. 취소선만으로는 "지워진 값"이라는
                  게 스크린리더에 전달되지 않아 `<s>`와 sr-only 라벨을 함께 쓴다. */}
              {cohort.listPrice && (
                <s className="font-medium text-ink/40 decoration-ink/40">
                  <span className="sr-only">정가 </span>
                  {cohort.listPrice}
                </s>
              )}
              <span>
                {cohort.listPrice && <span className="sr-only">할인가 </span>}
                {cohort.price}
              </span>
            </dd>
          </div>
        )}
        {cohort.show.capacity && cohort.capacity && (
          <div>
            <dt className="text-ink/45">정원</dt>
            <dd className="mt-1 font-semibold text-ink">{cohort.capacity}</dd>
          </div>
        )}
      </dl>

      <p className="text-sm text-ink/65">{clubOperation.meeting}</p>

      {cohort.show.cta && (
        <div className="flex flex-col gap-2">
          {isOpen && !cohort.ctaDisabled ? (
            <a
              href="/#contact"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold text-white transition-all outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              {cohort.label} 가입하기
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          ) : (
            <button
              type="button"
              disabled
              className="inline-flex h-13 cursor-not-allowed items-center justify-center rounded-full bg-ink/15 px-7 text-[0.95rem] font-semibold text-ink/50"
            >
              {cohortStatusLabel[cohort.status]}
            </button>
          )}
          {cohort.note && (
            <p className="text-center text-sm text-ink/60">{cohort.note}</p>
          )}
        </div>
      )}
    </section>
  );
}
