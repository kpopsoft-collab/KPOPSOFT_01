import type { Metadata } from "next";

import { Header } from "@/components/layout/header";
import { Footer } from "@/components/layout/footer";

/**
 * 정규 교육 과정 상세 — **빈 페이지(플레이스홀더)**.
 *
 * `/education` 프로그램 카드의 `정규 교육과정 알아보기` CTA가 여기로 온다.
 * 내용은 다른 작업자가 채울 예정이라 본문을 비워 두고 라우트만 열어 뒀다
 * (사용자 지시).
 *
 * 비워 두더라도 헤더와 푸터는 남긴다 — 본문만 없는 페이지에서 사이트를 빠져
 * 나갈 길까지 없으면 방문자가 뒤로가기 말고는 할 수 있는 게 없어진다.
 *
 * 채울 때 지울 것: 이 주석과 아래 `main`의 빈 자리. 헤더·푸터 구성은
 * `/education`(src/app/education/page.tsx)과 같다.
 */
export const metadata: Metadata = {
  title: "정규 교육 과정",
  // 내용이 없는 동안 검색 결과에 노출되면 빈 페이지가 회사 검색 결과로 잡힌다.
  robots: { index: false, follow: true },
};

export default function EducationProgramsPage() {
  return (
    <>
      <Header />
      <main className="flex-1" />
      <Footer />
    </>
  );
}
