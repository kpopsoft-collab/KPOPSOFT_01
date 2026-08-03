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

## ⚠️ 이 백로그가 **반드시 닫아야 하는 것** (release gate)

1번이 데이터 계약까지만 내고 넘긴 것들이다. 하나라도 빠지면 1번의 보안 설계가
실제로는 닫히지 않는다.

| # | 할 일 | 안 하면 |
|---|-------|---------|
| G1 | 상세 본문은 **slug 단건 조회**로 읽는다 | 목록 응답에 행마다 수백 KB HTML이 실린다. 목록 리더는 `detail_html`을 일부러 뺐다 |
| G2 | **렌더 직전에 `sanitizeCourseHtml()`을 한 번 더** 부른다 | 관리자는 RLS상 테이블을 직접 고칠 수 있어 서버 액션을 우회한 값이 그대로 렌더된다 |
| G3 | `dangerouslySetInnerHTML`에 넣는 값은 **G2를 통과한 것만**. 그 자리에 왜 안전한지 주석을 남긴다 | 다음 사람이 정제 없이 값을 바꿔 끼운다 |
| G4 | 정제 결과를 감싼 `.course-html-shell`을 **그대로 렌더**한다(`globals.css`의 `contain: paint`) | 업로드 CSS가 본문 밖으로 나가 가짜 전면 UI를 만들 수 있다 |
| G5 | 일정 표기는 `formatClassSchedule()`을 쓴다. `null`이면 줄 자체를 뺀다 | 목록·상세·어드민이 서로 다른 문자열을 쓰게 된다 |
| G6 | (선택) CSP 검토 | 인라인 `<style>`을 허용해야 하므로 정책과 충돌하는지 먼저 본다 |

근거: [01/08 §6](../01-regular-class-schedule-and-html/08-HTML정제-설계.md),
[01/09 §3-5](../01-regular-class-schedule-and-html/09-CSS스코프-설계.md),
[01/06 §P1-3](../01-regular-class-schedule-and-html/06-교차검증-결과.md).

## 아직 열려 있는 검증 (DB 키가 필요하다)

1번이 코드까지 냈지만 `.env.local`이 비어 로컬이 목 모드다. 2번을 시작하기 전에
[01/07 §5](../01-regular-class-schedule-and-html/07-실행계획-확정.md)의
"DB 적용 후로 미루는 항목"을 먼저 닫는 편이 안전하다 — 특히 **전 과정을
비공개로 했을 때 정적 4행이 되살아나지 않는지**는 이 페이지 동작과 직결된다.

## 결정이 필요한 것

| # | 질문 | 기본안 |
|---|------|--------|
| D1 | 상세 페이지 본문을 `detail_html`로 채울지, `curriculum` 기반 고정 레이아웃으로 채울지 | **둘 다**. `detail_html`이 있으면 그걸 쓰고, 없으면 고정 레이아웃 |
| D2 | `detailHref` 컬럼(자유 입력 경로)을 계속 쓸지 | `slug` 기반 `/education/programs/[slug]`로 통일. `detailHref`는 **외부 링크 예외용**으로만 남긴다 |
| D3 | 목록에 트랙 필터(AI 입문 / 실무 활용)를 넣을지 | 넣는다. `tracks` 컬럼이 이미 그 용도다 |
| D4 | 상세 페이지 하단 CTA를 문의 폼으로 보낼지, 신청 폼을 새로 만들지 | 기존 문의 섹션으로. 신청 폼은 범위 밖 |
