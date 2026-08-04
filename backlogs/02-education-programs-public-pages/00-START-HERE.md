# 02. `/education/programs` — DB 연동 목록·상세 페이지

정규 교육 과정 공개 페이지를 실제로 만든다. 지금은 **빈 껍데기**다.

대상
- `src/app/education/programs/page.tsx` — 목록 (현재 `<main>`만 있는 플레이스홀더)
- `src/app/education/programs/[slug]/page.tsx` — 상세 (**아직 없음, 신설**)

들어오는 길: `/education` 프로그램 카드의 `정규 교육과정 알아보기` CTA
(`src/components/sections/education/edu-programs.tsx:280` 부근)

## 읽는 순서

1. [01-요구사항.md](01-요구사항.md) — 두 페이지가 무엇을 보여주는가
2. [02-현황분석.md](02-현황분석.md) — 지금 있는 것과 없는 것
3. [03-데이터흐름.md](03-데이터흐름.md) — DB → 화면 경로, 폴백의 함정
4. [04-구현계획.md](04-구현계획.md) — 단계별 작업
5. [05-검증체크리스트.md](05-검증체크리스트.md)

## 선행 조건 — **1번은 2026-08-03에 끝났다**

[01-regular-class-schedule-and-html](../01-regular-class-schedule-and-html/00-START-HERE.md)이
`schedule_type` / `start_date` / `end_date` / `detail_html`을 만들었다.
`formatClassSchedule()`(`src/lib/education-content.ts`)과
`sanitizeCourseHtml()`(`src/lib/admin/sanitize-html.ts`)도 준비돼 있다.

## release gate — **2026-08-03 전부 닫힘**

| # | 할 일 | 어디서 |
|---|-------|--------|
| G1 | 상세 본문은 slug 단건 조회로 읽는다 | `public-content.ts` `getPublicRegularClassBySlug()` |
| G2 | 렌더 직전 재정제 | `course-html.tsx` — DB에 직접 심은 XSS를 실제로 막는 것을 확인 |
| G3 | `dangerouslySetInnerHTML`에는 정제 통과분만 + 근거 주석 | `course-html.tsx` |
| G4 | `.course-html-shell` 셸을 그대로 렌더 | `course-html.tsx` (셸 CSS 미수정) |
| G5 | 일정 표기는 `formatClassSchedule()` | `program-card.tsx`, `program-detail-hero.tsx` |
| G6 | CSP 검토 | **미이행** — 인라인 `<style>`을 허용해야 해서 정책과 충돌 여지가 있다. 별도로 판단한다 |

## 실제 DB로 확인한 것 (2026-08-03)

- 4개 slug 상세 전부 200, 없는 slug 404, 목록 200
- `<title>`이 `seo_title`을 따르고 canonical·og:url이 정식 도메인
- **비공개로 바꾸면 상세 404 + 목록에서 빠진다.** 나머지 과정은 그대로다
  (정적 4행으로 튀지 않는다)
- **정제 안 된 XSS를 DB `detail_html`에 직접 심어도** 렌더 직전 정제가
  `<script>`·`on*`·`<iframe>`·`javascript:`·`@import`·`position:fixed`를
  전부 막고 본문만 남긴다 (G2 실증)

**남은 것**: 어드민 화면에서 사람이 직접 HTML을 올려 상세에 나오는지 보는 것.

## 결정이 필요한 것

| # | 질문 | 기본안 |
|---|------|--------|
| D1 | 상세 페이지 본문을 `detail_html`로 채울지, `curriculum` 기반 고정 레이아웃으로 채울지 | **둘 다**. `detail_html`이 있으면 그걸 쓰고, 없으면 고정 레이아웃 |
| D2 | `detailHref` 컬럼(자유 입력 경로)을 계속 쓸지 | `slug` 기반 `/education/programs/[slug]`로 통일. `detailHref`는 **외부 링크 예외용**으로만 남긴다 |
| D3 | 목록에 트랙 필터(AI 입문 / 실무 활용)를 넣을지 | 넣는다. `tracks` 컬럼이 이미 그 용도다 |
| D4 | 상세 페이지 하단 CTA를 문의 폼으로 보낼지, 신청 폼을 새로 만들지 | 기존 문의 섹션으로. 신청 폼은 범위 밖 |
