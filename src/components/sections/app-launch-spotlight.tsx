import Image from "next/image";

import { Circle, Star } from "@/components/shapes";
import { LaunchPoster } from "@/components/ui/launch-poster";
import { NewTabLink } from "@/components/ui/new-tab-link";

const APP_STORE_URL = "https://apps.apple.com/app/id6808075877";

const launchPosts = [
  {
    label: "Threads",
    href: "https://www.threads.com/@kpopsoft_com/post/DdeeZb6gWop",
  },
  {
    label: "YouTube",
    href: "https://www.youtube.com/post/UgkxiZmdbpFNseUnLkMs1o5Pgy194C4H8d35",
  },
  {
    label: "Instagram",
    href: "https://www.instagram.com/kpopsoft_com/p/DdecMoeAZXK/",
  },
  {
    label: "TikTok",
    href: "https://www.tiktok.com/@kpopsoft_com/photo/7687284752826600712",
  },
  {
    label: "네이버 블로그",
    href: "https://blog.naver.com/orangedio/224417385677",
  },
] as const;

/**
 * 다섯 채널에 실제로 올린 1:1 출시 카드 원본을 그대로 쓴다(팝터디 게시 근거
 * `publication.json`). 대표 1장은 오른쪽 프레임, 나머지 4장은 아래 띠.
 *
 * 카드 제목은 이미지 안에 이미 박혀 있으므로 캡션에서 되풀이하지 않는다
 * (docs/04-디자인-시스템/10-이미지-방향.md — "캡션은 제목을 반복하지 말고
 * 이미지에서 확인되는 맥락을 설명한다"). 대신 앱의 학습 갈래를 라벨로 얹는다.
 */
const featurePosters = [
  {
    src: "/work/kpopstudy-launch-hangul.jpg",
    label: "한글 첫걸음",
    labelClass: "text-brand-blue",
    caption: "자음·모음부터 기본 음절표까지",
    alt: "'놀이로 배우는 첫 한글' 카드 — 토끼와 곰 캐릭터가 태블릿으로 자음 ㄱ을 따라 쓰는 장면",
  },
  {
    src: "/work/kpopstudy-launch-fairytale.jpg",
    label: "이야기·주제 학습",
    labelClass: "text-brand-red",
    caption: "전래동화와 테마 낱말로 넓히는 어휘",
    alt: "'마음이 자라는 전래동화' 카드 — 태블릿 위로 펼쳐진 동화책에서 한복 입은 아이와 동물들이 튀어나온 장면",
  },
  {
    src: "/work/kpopstudy-launch-math.jpg",
    label: "생각하는 수학",
    labelClass: "text-brand-mint-ink",
    caption: "수 세기와 도형을 퀴즈·놀이처럼",
    alt: "'신나는 수학 & 창의 놀이' 카드 — 놀이방 책상 위 태블릿과 숫자 1·2·3, 색종이 접기 모형",
  },
  {
    src: "/work/kpopstudy-launch-appstore.jpg",
    label: "지금 내려받기",
    labelClass: "text-brand-navy",
    caption: "iPhone과 iPad에서 무료로 시작",
    alt: "'App Store에서 만나요' 카드 — 팝터디 첫 화면이 켜진 아이폰과 아이패드가 나란히 놓인 장면",
  },
] as const;

/**
 * 홈 최상단의 기간 한정 출시 소식. Hero와 StatsBar가 맞닿는 기존 구성을
 * 깨지 않도록 Hero 앞에 둔다. 모든 이동은 링크 자체로 동작해 JS가 없어도
 * App Store와 각 채널의 원문을 바로 열 수 있다.
 *
 * 3단 구성 — ① 카피 + CTA와 대표 카드, ② 학습 갈래 카드 4장,
 * ③ 채널별 원문 링크. 노란 띠가 빈 색면으로 남지 않게 좌우를 같은 무게로
 * 채우고, 도형은 카드 뒤로 겹쳐 잘리게 둬서 떠 있는 얼룩처럼 보이지 않게 한다.
 */
export function AppLaunchSpotlight() {
  return (
    <section
      aria-labelledby="app-launch-title"
      className="relative overflow-hidden border-y border-ink/15 bg-brand-yellow"
    >
      <Circle
        variant="outline"
        className="pointer-events-none absolute -top-28 -left-32 size-72 text-ink/10"
      />
      <Star className="pointer-events-none absolute right-[8%] bottom-8 size-16 text-ink/10" />

      <div className="relative container-editorial py-12 md:py-16">
        <div className="grid items-center gap-10 md:grid-cols-12 lg:gap-14">
          <div className="md:col-span-7">
            <p className="inline-flex rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold tracking-wider text-white">
              NEW · iOS 정식 출시
            </p>

            <h2
              id="app-launch-title"
              className="mt-5 text-[clamp(1.875rem,2.6vw+0.5rem,3rem)] leading-[1.15] font-extrabold tracking-tight text-ink"
            >
              팝터디 iOS 앱,
              <br />
              지금 App Store에서 만나보세요.
            </h2>

            <p className="mt-5 max-w-xl text-body-lg text-ink/75">
              5~8세 어린이가 한글·영어·수학을 놀이처럼 익히는 팝터디가 iPhone과
              iPad 앱으로 정식 출시됐습니다. 로그인 없이도 주요 학습 기능을
              무료로 체험할 수 있습니다.
            </p>

            <div className="mt-7">
              <NewTabLink href={APP_STORE_URL}>
                App Store에서 무료로 받기
              </NewTabLink>
            </div>

            <p className="mt-6 text-sm font-semibold text-ink/60">
              <time dateTime="2026-09-20">2026년 9월 20일</time> · 다섯 채널
              동시 공개
            </p>
          </div>

          {/* 태블릿 폭에서 1:1 카드가 700px 정사각형으로 부풀지 않게 폭을 묶는다. */}
          <div className="relative mx-auto w-full max-w-sm md:col-span-5 md:max-w-none">
            <div
              className="absolute -top-6 -right-4 size-28 rounded-full bg-brand-red sm:size-36"
              aria-hidden
            />
            <div
              className="absolute -bottom-7 -left-5 size-24 rotate-12 bg-brand-blue sm:size-32"
              aria-hidden
            />

            <figure className="relative rounded-3xl border border-ink/15 bg-white p-3">
              <Image
                src="/work/kpopstudy-launch-hero.jpg"
                alt="'팝터디 iOS 앱 출시' 대표 카드 — 아이와 공룡 캐릭터가 한글 블록이 떠 있는 태블릿으로 노는 장면"
                width={1024}
                height={1024}
                sizes="(min-width: 768px) 38vw, 92vw"
                className="aspect-square w-full rounded-2xl object-cover"
                priority
              />
              <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2 px-2 pt-4 pb-1">
                <div>
                  <p className="font-bold text-ink">팝터디 · kpopstudy</p>
                  <p className="mt-1 text-sm text-ink/60">
                    어린이 학습 · 교육 · 4세 이상
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-mint px-3 py-1.5 text-xs font-bold text-ink">
                  iPhone · iPad
                </span>
              </figcaption>
            </figure>
          </div>
        </div>

        <div className="mt-14 border-t border-ink/20 pt-8">
          <p className="text-sm font-bold text-ink">앱에서 만나는 학습</p>
          <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-4 lg:gap-5">
            {featurePosters.map((poster) => (
              <li key={poster.src}>
                <LaunchPoster
                  src={poster.src}
                  alt={poster.alt}
                  label={poster.label}
                  labelClassName={poster.labelClass}
                  caption={poster.caption}
                  sizes="(min-width: 768px) 21vw, 44vw"
                />
              </li>
            ))}
          </ul>
        </div>

        <div className="mt-10 flex flex-wrap items-center gap-x-6 gap-y-3 border-t border-ink/20 pt-6">
          <p className="text-sm font-bold text-ink">채널별 출시 소식</p>
          <ul className="flex flex-wrap gap-2">
            {launchPosts.map((post) => (
              <li key={post.label}>
                <NewTabLink
                  href={post.href}
                  variant="secondary"
                  size="compact"
                  className="bg-ivory/30"
                >
                  {post.label}
                </NewTabLink>
              </li>
            ))}
          </ul>
        </div>
      </div>
    </section>
  );
}
