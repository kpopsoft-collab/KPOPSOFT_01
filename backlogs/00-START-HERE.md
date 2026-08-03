# 백로그 — 시작점

작업 대기 중인 기능 묶음이다. 기능 하나가 폴더 하나이고, 각 폴더의
`00-START-HERE.md`가 그 기능의 시작점이다. **폴더 안 문서는 번호 순서대로 읽는다.**

작업 전 [CLAUDE.md](../CLAUDE.md)와 거기 연결된 `docs/` 기준 문서를 먼저 본다.
백로그 문서와 `docs/`가 어긋나면 `docs/`가 우선이고, 백로그 쪽을 고친다.

## 목록

| # | 폴더 | 한 줄 | 상태 |
|---|------|-------|------|
| 1 | [01-regular-class-schedule-and-html](01-regular-class-schedule-and-html/00-START-HERE.md) | 정규 클래스 폼에 일정 유형(원데이/다회차)과 HTML 상세 업로드 추가 | 대기 |
| 2 | [02-education-programs-public-pages](02-education-programs-public-pages/00-START-HERE.md) | `/education/programs` 목록·상세 페이지를 DB에 연결해 구현 | 대기 |
| 3 | [03-regular-class-form-merge](03-regular-class-form-merge/00-START-HERE.md) | 정규 클래스 `new`와 `[id]` 페이지를 하나로 병합 | 대기 |
| 4 | [04-club-cohort-publish-mismatch](04-club-cohort-publish-mismatch/00-START-HERE.md) | **버그** — 클럽 기수 저장이 없는 `is_published` 컬럼 때문에 실패 | 대기 |

## 셋의 관계

세 건은 모두 **정규 클래스(`education_regular_classes`)** 하나를 건드린다.
따로 하면 같은 파일을 세 번 고치게 되므로 순서를 정해 둔다.

```
1. 스키마 · 폼 확장  ──▶  3. 폼 화면 병합  ──▶  2. 공개 페이지
   (컬럼/타입/폼)         (라우트 정리)         (1이 넣은 필드를 화면에 씀)
```

- **1 → 3**: 3은 1이 만든 최종 폼을 감싸는 껍데기 정리다. 1보다 먼저 하면
  병합한 화면을 1에서 또 손대게 된다. 다만 3은 1과 **같은 PR에서 이어서** 해도
  된다(둘 다 어드민 폼 한 곳이라 충돌 지점이 겹친다).
- **1 → 2**: 2의 상세 페이지가 보여줄 일정·HTML 본문이 1에서 생긴다. 1 없이
  2를 먼저 하면 상세 페이지를 나중에 다시 열어야 한다.
- 2의 **목록 페이지**만은 1과 독립이다. 급하면 목록부터 먼저 내보낼 수 있다.
- **4는 위 셋과 다른 기능(클럽 기수)이지만 같은 파일**(`content-types.ts`,
  `supabase-content.ts`)을 만진다. 1을 끝낸 뒤에 한다.

## 공통 배경 — 이 기능들이 닿는 지점

| 층 | 파일 |
|----|------|
| DB 스키마 | `supabase/migrations/20260802120000_p3_education_ver3.sql` (§02 정규 클래스) |
| 어드민 타입 | `src/lib/admin/content-types.ts` — `EducationRegularClass` |
| 어드민 매핑 | `src/lib/admin/supabase-content.ts` — `FIELDS.education_regular_classes` |
| 어드민 목데이터 | `src/lib/admin/mock-content.ts` — `mockEducationRegularClasses` |
| 어드민 폼 | `src/components/admin/content/education/regular-classes/regular-class-form.tsx` |
| 어드민 액션 | `src/app/admin/(shell)/content/education/regular-classes/actions.ts` |
| 공개 타입·폴백 | `src/lib/education-content.ts` — `RegularClass`, `regularClasses` |
| 공개 리더 | `src/lib/public-content.ts` — `getPublicRegularClasses()` |
| 공개 화면 | `src/components/sections/education/edu-programs.tsx`, `src/app/education/programs/page.tsx` |

**필드 하나를 늘리면 위 7~8곳이 같이 움직인다.** 이 사실이 세 문서 모두의
구현 계획을 지배한다.
