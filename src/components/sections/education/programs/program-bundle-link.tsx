import { ArrowUpRight } from "lucide-react";

import { Section } from "@/components/layout/section";

/**
 * 과정 상세 자료(번들) 링크 블록 (백로그 05 §3).
 *
 * 본문이 아니라 부가 자료로 가는 통로다 — 번들 내용은 검색에 색인되지
 * 않으므로 이 블록이 없어도 상세 페이지 자체는 온전해야 한다(요구사항 §3-1).
 * 그래서 `[slug]/page.tsx`가 `bundleUrl`이 있을 때만 이 컴포넌트를 그린다.
 *
 * `<a>`를 직접 쓴다 — `CtaButton`은 외부 링크에 `rel="noreferrer"`만 붙이는데
 * 여기는 `noopener`도 필요하다(요구사항 §3). `selected-work.tsx`의 "사이트
 * 방문하기" 링크와 같은 패턴 — 아이콘(시각) + `sr-only` 문구(스크린리더)
 * 양쪽으로 새 창에서 열린다는 것을 알린다.
 */
export function ProgramBundleLink({ url }: { url: string }) {
  return (
    <Section className="bg-ivory">
      <div className="rounded-3xl border border-ink/10 bg-white p-8 md:p-10">
        <div className="max-w-xl">
          <h2 className="text-xl leading-snug font-extrabold tracking-tight text-ink md:text-2xl">
            과정 상세 자료
          </h2>
          <p className="mt-3 text-body-lg text-ink/70">
            이미지와 커리큘럼이 담긴 상세 페이지를 새 창에서 볼 수 있습니다.
          </p>
          <div className="mt-6">
            <a
              href={url}
              target="_blank"
              rel="noopener noreferrer"
              className="group inline-flex h-13 items-center justify-center gap-2 rounded-full bg-brand-blue px-7 text-[0.95rem] font-semibold whitespace-nowrap text-white transition-colors outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-ivory"
            >
              상세 자료 보기
              <span className="sr-only"> (새 창에서 열림)</span>
              <ArrowUpRight
                className="size-4 transition-transform duration-200 group-hover:translate-x-0.5 group-hover:-translate-y-0.5"
                aria-hidden
              />
            </a>
          </div>
        </div>
      </div>
    </Section>
  );
}
