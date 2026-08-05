import { FileText } from "lucide-react";

import { NewTabLink } from "@/components/ui/new-tab-link";

/**
 * 과정 상세 자료 링크 블록 (백로그 05 §3, 백로그 06 03-화면구조-결정.md D1·D2).
 *
 * 본문이 아니라 부가 자료로 가는 통로다 — 자료 내용은 검색에 색인되지
 * 않으므로 이 블록이 없어도 상세 페이지 자체는 온전해야 한다(백로그 05
 * 요구사항 §3-1). 상세 페이지 본문(커리큘럼)은 이제 **항상** 따로 있으므로
 * 이 전제가 실제로 성립한다(백로그 06 D4).
 *
 * 자료는 zip 번들이거나 `.html` 한 장이고, 둘 다 Storage의
 * `education/<uuid>/index.html`로 올라가 **같은 링크 한 종류**가 된다
 * (백로그 06 D2). 예전에 `.html`을 페이지 안에 인라인으로 그리던 경로는
 * 폐지됐다 — 정제가 `<script>`와 `@keyframes`를 지워 업로드물이 빈 화면으로
 * 나왔기 때문이다(백로그 06 01-현황분석 §2·§3).
 *
 * `CtaButton` 대신 `NewTabLink`를 쓴다 — `CtaButton`은 외부 링크에
 * `rel="noreferrer"`만 붙이는데 여기는 `noopener`도 필요하다(백로그 05
 * 요구사항 §3). 아이콘(시각)과 `sr-only` 문구(스크린리더) 양쪽으로 새 창에서
 * 열린다는 것을 알리는 처리도 그 컴포넌트가 갖고 있다.
 *
 * ⚠️ `Section` 래퍼를 갖지 않는다. 본문 컬럼 안에 들어가므로 세로 리듬은
 * 부모가 준다(백로그 06 03 §2 ⑦).
 */
export function ProgramBundleLink({ url }: { url: string }) {
  return (
    <div className="rounded-3xl border border-ink/10 bg-white p-7 md:p-8">
      <div className="flex items-start gap-4">
        <span
          aria-hidden
          className="flex size-11 shrink-0 items-center justify-center rounded-full bg-brand-yellow text-ink"
        >
          <FileText className="size-5" />
        </span>
        <div>
          <h2 className="text-xl leading-snug font-extrabold tracking-tight text-ink md:text-2xl">
            과정 상세 자료
          </h2>
          <p className="mt-3 text-body-lg text-ink/70">
            강의 자료 원본을 새 창에서 그대로 볼 수 있습니다. 이미지와 서식이
            만든 그대로 열립니다.
          </p>
          <div className="mt-6">
            <NewTabLink href={url}>상세 자료 보기</NewTabLink>
          </div>
        </div>
      </div>
    </div>
  );
}
