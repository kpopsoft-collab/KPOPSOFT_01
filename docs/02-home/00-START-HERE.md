# 02. 홈(`/`) — 시작점

홈 랜딩페이지의 기준 문서다. 구현은 `src/app/page.tsx`와
`src/components/sections/*`에 있다.

## ⚠️ 충돌하면 앞 번호가 이긴다

문서 4종이 시간 순으로 쌓여 있다. **번호가 작을수록 최신**이다.

```text
01        WHY KPOPSOFT 수정 요청      ← 가장 최신
02        홈 4차 수정 요청
03 ~ 05, 07   최종 수정 요청서         ← 확정 카피의 출처
08 ~ 11   ver3 기획서                 ← 그 앞 단계
```

특히 **WHY KPOPSOFT 레이더**는 `01`이 `02 §3`을 대체하므로 **01이 최종**이다.

## 읽는 순서

| # | 문서 | 한 줄 |
|---|------|-------|
| 1 | [01-why-kpopsoft-수정요청.md](01-why-kpopsoft-수정요청.md) | **최신.** 섹션 위치 이동, 차별점 카드 3장, 레이더 5축 교체 |
| 2 | [02-홈-4차-수정요청.md](02-홈-4차-수정요청.md) | 사례·핵심사업·프로세스 보강 (§3 레이더는 01이 대체) |
| 3 | [03-최종수정요청-섹션순서와-히어로.md](03-최종수정요청-섹션순서와-히어로.md) | 섹션 순서 확정, Header, Hero, 성과 수치, OUR IDENTITY 신설 |
| 4 | [04-최종수정요청-핵심사업과-프로젝트개요.md](04-최종수정요청-핵심사업과-프로젝트개요.md) | 핵심 사업 3분할, 주요 프로젝트 카드 구조 |
| 5 | [05-최종수정요청-프로젝트-3건.md](05-최종수정요청-프로젝트-3건.md) | 신도렌탈 / 셀프 마케팅 / 카카오톡 챗봇 상세와 카드 문구 |
| 6 | [07-최종수정요청-프로세스-문의-푸터.md](07-최종수정요청-프로세스-문의-푸터.md) | 프로젝트 진행 방식, 문의 폼, Footer, 반응형 점검 |
| 7 | [08-ver3-변경요약과-구조.md](08-ver3-변경요약과-구조.md) | ver2→ver3 변경 요약, 7섹션 구조, IA 개정 이력 |
| 8 | [09-ver3-header-hero-핵심비즈니스.md](09-ver3-header-hero-핵심비즈니스.md) | Header 메뉴/CTA, Hero 카피, 핵심 비즈니스 3분할 |
| 9 | [10-ver3-통계바와-포트폴리오.md](10-ver3-통계바와-포트폴리오.md) | 통계바 4지표, 포트폴리오 필터·이미지 원칙 |
| 10 | [11-ver3-contact-footer-완료조건.md](11-ver3-contact-footer-완료조건.md) | CONTACT 문의 유형, 앵커 이동, Footer, 완료 조건 |

코드 주석의 `docs/02-home/ §SECTION NN`은 ver3 기획서의 섹션 번호다 —
`01·02·03` → 9번, `04·05` → 10번, `07` → 11번.

## 섹션 → 문서 → 코드

| 홈 섹션 | 기준 문서 | 구현 |
|---------|----------|------|
| Header | [09](09-ver3-header-hero-핵심비즈니스.md), [03 §3](03-최종수정요청-섹션순서와-히어로.md) | `src/components/layout/` |
| Hero | [03 §4](03-최종수정요청-섹션순서와-히어로.md), [09](09-ver3-header-hero-핵심비즈니스.md) | `sections/hero.tsx` |
| 주요 성과 수치(통계바) | [03 §5](03-최종수정요청-섹션순서와-히어로.md), [10](10-ver3-통계바와-포트폴리오.md) | `sections/stats-bar.tsx` |
| OUR IDENTITY | [03 §6](03-최종수정요청-섹션순서와-히어로.md) | `sections/our-identity.tsx` |
| 핵심 사업 영역 | [04](04-최종수정요청-핵심사업과-프로젝트개요.md), [02 §2](02-홈-4차-수정요청.md) | `sections/what-we-do.tsx` |
| WHY KPOPSOFT | **[01](01-why-kpopsoft-수정요청.md)** | `sections/why-kpopsoft.tsx` |
| 주요 프로젝트(포트폴리오) | [05](05-최종수정요청-프로젝트-3건.md), [02 §1](02-홈-4차-수정요청.md), [10](10-ver3-통계바와-포트폴리오.md) | `sections/selected-work.tsx` |
| 프로젝트 진행 방식 | [07 §14](07-최종수정요청-프로세스-문의-푸터.md), [02 §4](02-홈-4차-수정요청.md) | `sections/process.tsx` |
| CONTACT | [07 §15](07-최종수정요청-프로세스-문의-푸터.md), [11](11-ver3-contact-footer-완료조건.md) | `sections/final-cta.tsx` |
| Footer | [07 §16](07-최종수정요청-프로세스-문의-푸터.md) | `src/components/layout/` |

> **WHY KPOPSOFT는 포트폴리오 앞**이다 — [01](01-why-kpopsoft-수정요청.md) §1에서
> 옮겼다. 판단 근거는 [../07-dev/04-작업로그-2026-08-02.md](../07-dev/04-작업로그-2026-08-02.md).

> ⚠️ `sections/business-overview.tsx`, `ai-solutions.tsx`, `software.tsx`,
> `about-summary.tsx`, `education-banner.tsx` 등은 **`page.tsx`가 import하지 않는
> 옛 파일**이다(ver3에서 제거하며 파일만 보존). 실제 화면을 고치려면 위 표의
> 파일을 고쳐야 한다. 어느 것이 살아 있는지는 `src/app/page.tsx`의 import가 기준이다.

## 콘텐츠는 코드에 없다

홈 콘텐츠(포트폴리오·통계·문의 유형·강사진)는 **Supabase**에서 읽는다
(`src/lib/public-content.ts`). `src/lib/site.ts`는 DB가 비었을 때 쓰는
**폴백 시드**다 — 시드만 고치면 화면은 바뀌지 않는다.

특히 문의 유형은 DB와 시드 값이 서로 다르다. 이유는
[../01-ia/04-홈-contact-DB-마이그레이션.md](../01-ia/04-홈-contact-DB-마이그레이션.md).

## 함께 보기

- 전체 구조 요약 — [../01-ia/01-관통원칙과-홈-IA.md](../01-ia/01-관통원칙과-홈-IA.md)
- 색·타이포·도형 토큰 — [../04-design-system/00-START-HERE.md](../04-design-system/00-START-HERE.md)
- 카드 이미지 원칙과 프롬프트 — [../05-assets/00-START-HERE.md](../05-assets/00-START-HERE.md)
- 이전 결정의 변경 경위 — [../07-dev/00-START-HERE.md](../07-dev/00-START-HERE.md)

← [문서 전체 시작점](../00-START-HERE.md)
