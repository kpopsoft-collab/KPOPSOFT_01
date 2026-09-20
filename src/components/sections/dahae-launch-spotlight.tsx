import Image from "next/image";

import { Circle } from "@/components/shapes";
import { LaunchPoster } from "@/components/ui/launch-poster";
import { NewTabLink } from "@/components/ui/new-tab-link";

const APP_STORE_URL = "https://apps.apple.com/kr/app/id6801609701";
const PLAY_STORE_URL =
  "https://play.google.com/store/apps/details?id=com.kpopsoft.dahaejob";
const SERVICE_URL = "https://www.dahaejob.com/";

/**
 * 다해잡 스토어 소개 포스터 5장(2:3). 다해 레포의
 * `docs/앱스토어/이미지/`에 있는 원본을 그대로 쓴다 — 스토어에 올린 그림과
 * 사이트가 보여주는 그림이 같아야 한다.
 *
 * 캡션 문구는 스토어 등록 상세 설명(`등록용_텍스트/공통_상세설명.txt`)에
 * 적힌 기능만 옮겼다. 그 문서의 작성 기준이 "근거 없는 소요시간·사용자 수·
 * 채용률·최상급 표현을 넣지 않는다"이므로 여기서도 새 주장을 만들지 않는다.
 */
const featurePosters = [
  {
    src: "/work/dahaejob-launch-filter.jpg",
    label: "공고 탐색",
    labelClass: "text-brand-blue",
    caption: "오늘·내일·최근 7일 필터와 역별 정렬",
    alt: "'원하는 조건, 골라서 찾으세요' 포스터 — 위치·달력·필터 아이콘과 돋보기가 놓인 장면",
  },
  {
    src: "/work/dahaejob-launch-contact.jpg",
    label: "직접 연락",
    labelClass: "text-brand-red",
    caption: "공고 원문과 근무 조건을 확인한 뒤 통화",
    alt: "'공고 확인 후, 전화·문자로 직접 연락' 포스터 — 수화기와 말풍선, 공고 카드가 놓인 장면",
  },
  {
    src: "/work/dahaejob-launch-record.jpg",
    label: "근무·수입 기록",
    labelClass: "text-brand-navy",
    caption: "참여한 현장과 일당을 캘린더에 직접 기록",
    alt: "'내가 일한 날, 수입까지 차곡차곡' 포스터 — 달력과 수첩, 동전과 통계 아이콘이 놓인 장면",
  },
  {
    src: "/work/dahaejob-launch-community.jpg",
    label: "마켓·커뮤니티",
    labelClass: "text-brand-mint-ink",
    caption: "장비 중고거래와 현장 이야기를 세 언어로",
    alt: "'현장 이야기, 익숙한 언어로 함께해요' 포스터 — 청소 도구가 담긴 가방과 말풍선 아이콘이 놓인 장면",
  },
] as const;

/**
 * 팝터디 밴드 바로 아래에 붙는 두 번째 출시 소식 — 다해잡 iOS·Android 출시.
 *
 * 구성은 위 밴드(`app-launch-spotlight.tsx`)와 같은 3단이다. 같은 성격의
 * 소식을 연달아 놓는 자리라 구조가 어긋나면 두 번째가 곁다리로 읽힌다.
 * 대신 **바탕색으로 구분한다** — 팝터디는 옐로, 다해잡은 잉크. 포스터 5장이
 * 전부 검정 바탕에 라임 포인트라 노란 띠에 얹으면 서로 싸운다.
 *
 * 스토어가 둘이라 CTA도 둘이다. 아이보리 채움(App Store)과 아이보리 테두리
 * (Google Play)로 우선순위를 주되 둘 다 같은 높이로 둔다.
 */
export function DahaeLaunchSpotlight() {
  return (
    <section
      aria-labelledby="dahae-launch-title"
      className="relative overflow-hidden bg-ink text-ivory"
    >
      <Circle
        variant="outline"
        className="pointer-events-none absolute -right-24 -bottom-32 size-72 text-ivory/10"
      />

      <div className="relative container-editorial py-12 md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-12 lg:gap-14">
          <div className="md:col-span-7">
            <p className="inline-flex rounded-full bg-brand-mint px-3 py-1.5 text-xs font-bold tracking-wider text-ink">
              NEW · iOS · Android 출시
            </p>

            <h2
              id="dahae-launch-title"
              className="mt-5 text-[clamp(1.875rem,2.6vw+0.5rem,3rem)] leading-[1.15] font-extrabold tracking-tight text-ivory"
            >
              다해잡, App Store와
              <br />
              Google Play에서 만나보세요.
            </h2>

            <p className="mt-5 max-w-xl text-body-lg text-ivory/75">
              청소 현장의 구인 공고를 모이는 역·일당·작업 날짜로 확인하고,
              담당자에게 전화나 문자로 바로 연락하는 다해잡이 iPhone·iPad와
              Android 앱으로 출시됐습니다. 한국어·몽골어·영어를 지원합니다.
            </p>

            <div className="mt-7 flex flex-wrap gap-3">
              <NewTabLink
                href={APP_STORE_URL}
                variant="ivory"
                className="focus-visible:ring-offset-ink"
              >
                App Store에서 받기
              </NewTabLink>
              <NewTabLink
                href={PLAY_STORE_URL}
                variant="ivoryOutline"
                className="focus-visible:ring-offset-ink"
              >
                Google Play에서 받기
              </NewTabLink>
            </div>

            <p className="mt-6 text-sm font-semibold text-ivory/60">
              무료 설치 · iPhone · iPad · Android · 한국어·몽골어·영어
            </p>
          </div>

          {/* 2:3 세로 포스터라 1:1 카드와 같은 폭을 주면 혼자 800px로 솟는다. */}
          <div className="relative mx-auto w-full max-w-[17rem] sm:max-w-xs md:col-span-5 lg:max-w-[22rem]">
            <div
              className="absolute -top-6 -right-5 size-24 rounded-full bg-brand-mint sm:size-28"
              aria-hidden
            />
            <div
              className="absolute -bottom-6 -left-5 size-20 rotate-12 bg-brand-yellow sm:size-24"
              aria-hidden
            />

            <figure className="relative rounded-3xl border border-ink/15 bg-white p-3">
              <Image
                src="/work/dahaejob-launch-hero.jpg"
                alt="'청소 일자리, 조건부터 한눈에' 다해 대표 포스터 — 청소 도구함과 위치·달력·전화 아이콘이 놓인 장면"
                width={1024}
                height={1536}
                sizes="(min-width: 1024px) 352px, (min-width: 640px) 320px, 70vw"
                className="aspect-[2/3] w-full rounded-2xl object-cover"
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 pt-4 pb-1">
                <div>
                  <p className="font-bold text-ink">다해잡 · dahaejob</p>
                  <p className="mt-1 text-sm text-ink/60">
                    청소 일자리 정보 · 비즈니스
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-mint px-3 py-1.5 text-xs font-bold text-ink">
                  iOS · Android
                </span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-14 border-t border-ivory/20 pt-8">
          <p className="text-sm font-bold text-ivory">앱에서 할 수 있는 것</p>
          <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
            {featurePosters.map((poster) => (
              <li key={poster.src}>
                <LaunchPoster
                  src={poster.src}
                  alt={poster.alt}
                  label={poster.label}
                  labelClassName={poster.labelClass}
                  caption={poster.caption}
                  ratio="portrait"
                  sizes="(min-width: 768px) 21vw, 44vw"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center justify-between gap-x-6 gap-y-3 border-t border-ivory/20 pt-6">
          <p className="max-w-2xl text-sm text-ivory/60">
            다해는 구인 공고 정보를 제공하고 당사자 간 직접 연락을 돕는 정보
            플랫폼입니다. 직접 고용이나 취업 알선을 하지 않습니다.
          </p>
          <NewTabLink
            href={SERVICE_URL}
            variant="ivoryOutline"
            size="compact"
            className="focus-visible:ring-offset-ink"
          >
            dahaejob.com
          </NewTabLink>
        </div>
      </div>
    </section>
  );
}
