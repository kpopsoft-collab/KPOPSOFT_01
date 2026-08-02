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

## 선행 조건

[01-regular-class-schedule-and-html](../01-regular-class-schedule-and-html/00-START-HERE.md)이
`schedule_type` / `start_date` / `end_date` / `detail_html`을 만든다.
**상세 페이지는 이 필드들을 쓴다.**

- 1번이 먼저면 → 상세 페이지를 한 번에 완성한다 (권장)
- 2번을 먼저 해야 하면 → **목록 페이지만** 먼저 내고, 상세는 1번 이후로 미룬다.
  목록은 기존 필드만으로 충분하다

## 결정이 필요한 것

| # | 질문 | 기본안 |
|---|------|--------|
| D1 | 상세 페이지 본문을 `detail_html`로 채울지, `curriculum` 기반 고정 레이아웃으로 채울지 | **둘 다**. `detail_html`이 있으면 그걸 쓰고, 없으면 고정 레이아웃 |
| D2 | `detailHref` 컬럼(자유 입력 경로)을 계속 쓸지 | `slug` 기반 `/education/programs/[slug]`로 통일. `detailHref`는 **외부 링크 예외용**으로만 남긴다 |
| D3 | 목록에 트랙 필터(AI 입문 / 실무 활용)를 넣을지 | 넣는다. `tracks` 컬럼이 이미 그 용도다 |
| D4 | 상세 페이지 하단 CTA를 문의 폼으로 보낼지, 신청 폼을 새로 만들지 | 기존 문의 섹션으로. 신청 폼은 범위 밖 |
