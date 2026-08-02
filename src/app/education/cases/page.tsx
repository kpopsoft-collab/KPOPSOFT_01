import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * 교육 사례 전체 목록 — **빈 페이지(플레이스홀더)**.
 *
 * `/education` 교육 사례 섹션의 `전체보기` CTA가 여기로 온다. 섹션에서는 3건만
 * 보여주고 나머지는 이 페이지에서 본다. 내용은 다른 작업자가 채울 예정이라
 * 본문을 비워 두고 라우트만 열어 뒀다 — `/education/programs`와 같은 방식이다.
 *
 * 비워 두더라도 헤더와 푸터는 남긴다. 본문만 없는 페이지에서 사이트를 빠져
 * 나갈 길까지 없으면 방문자가 뒤로가기 말고는 할 수 있는 게 없어진다.
 *
 * 채울 때 지울 것: 이 주석, 아래 `main`의 빈 자리, 그리고 `robots`.
 */
export const metadata: Metadata = {
  title: "교육 사례",
  // 내용이 없는 동안 검색 결과에 노출되면 빈 페이지가 회사 검색 결과로 잡힌다.
  robots: { index: false, follow: true },
};

export default function EducationCasesPage() {
  return (
    <>
      <Header />
      <main className="flex-1" />
      <Footer />
    </>
  );
}
