import Image from "next/image";

import { NewTabLink } from "@/components/ui/new-tab-link";
import { TagList } from "@/components/ui/tag";

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

const launchFeatures = [
  "한글 첫걸음",
  "이야기·주제 학습",
  "퀴즈·놀이",
  "생각하는 수학",
];

/**
 * 홈 최상단의 기간 한정 출시 소식. Hero와 StatsBar가 맞닿는 기존 구성을
 * 깨지 않도록 Hero 앞에 둔다. 모든 이동은 링크 자체로 동작해 JS가 없어도
 * App Store와 각 채널의 원문을 바로 열 수 있다.
 */
export function AppLaunchSpotlight() {
  return (
    <section
      aria-labelledby="app-launch-title"
      className="relative overflow-hidden border-y border-ink/15 bg-brand-yellow"
    >
      <div className="container-editorial py-10 md:py-14">
        <div className="grid items-center gap-10 lg:grid-cols-12 lg:gap-12">
          <div className="relative z-10 lg:col-span-7">
            <p className="inline-flex rounded-full bg-brand-red px-3 py-1.5 text-xs font-bold tracking-wider text-white">
              NEW · iOS 정식 출시
            </p>

            <h2
              id="app-launch-title"
              className="mt-5 max-w-3xl text-section text-ink"
            >
              팝터디 iOS 앱,
              <br />
              지금 App Store에서 만나보세요.
            </h2>

            <p className="mt-6 max-w-2xl text-body-lg text-ink/75">
              5~8세 어린이가 한글·영어·수학을 놀이처럼 익히는 팝터디가
              iPhone과 iPad 앱으로 정식 출시됐습니다. 로그인 없이도 주요 학습
              기능을 무료로 체험할 수 있습니다.
            </p>

            <TagList tags={launchFeatures} className="mt-6" />

            <div className="mt-8">
              <NewTabLink href={APP_STORE_URL}>
                App Store에서 무료로 받기
              </NewTabLink>
            </div>

            <div className="mt-8 border-t border-ink/20 pt-6">
              <p className="text-sm font-bold text-ink">채널별 출시 소식</p>
              <ul className="mt-3 flex flex-wrap gap-2">
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

          <div className="relative lg:col-span-5">
            <div
              className="absolute -top-5 -right-5 size-24 rounded-full bg-brand-red sm:size-32"
              aria-hidden
            />
            <div
              className="absolute -bottom-6 -left-6 size-20 rotate-12 bg-brand-blue sm:size-28"
              aria-hidden
            />

            <div className="relative overflow-hidden rounded-3xl border border-ink/15 bg-white p-3">
              <Image
                src="/work/kpopstudy-platform.png"
                alt="팝터디의 한글 학습과 테마 놀이 콘텐츠 화면"
                width={1600}
                height={900}
                sizes="(min-width: 1024px) 36vw, 100vw"
                className="aspect-[16/10] w-full rounded-2xl object-cover object-top"
                loading="eager"
                fetchPriority="high"
              />
              <div className="flex items-center justify-between gap-4 px-3 pt-4 pb-2">
                <div>
                  <p className="font-bold text-ink">팝터디 · kpopstudy</p>
                  <p className="mt-1 text-sm text-ink/60">
                    어린이 학습 · 교육 · 4세 이상
                  </p>
                </div>
                <span className="shrink-0 rounded-full bg-brand-mint px-3 py-1.5 text-xs font-bold text-ink">
                  iPhone · iPad
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
