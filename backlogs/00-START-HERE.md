# 백로그 — 시작점

기능 묶음 하나가 폴더 하나이고, 각 폴더의 `00-START-HERE.md`가 그 기능의 시작점이다.
**폴더 안 문서는 번호 순서대로 읽는다.**

> ⚠️ **여기 있는 5건은 모두 끝났다(2026-08-05 기준).** 이 폴더는 이제 *"왜 그렇게
> 정했나"*의 조사·결정 기록이고, **지금 무엇이 어떻게 동작하는가의 기준은 `docs/`로
> 승격돼 있다.** 아래 표의 오른쪽 링크를 먼저 본다 — 계획 문서에는 착수 전에 쓴,
> 구현과 다른 판단이 섞여 있다.

작업 전 [CLAUDE.md](../CLAUDE.md)와 거기 연결된 `docs/` 기준 문서를 먼저 본다.
백로그 문서와 `docs/`가 어긋나면 `docs/`가 우선이고, 백로그 쪽을 고친다.

## 목록

| # | 폴더 | 한 줄 | 상태 → 승격된 기준 문서 |
|---|------|-------|------|
| 1 | [01-regular-class-schedule-and-html](01-regular-class-schedule-and-html/00-START-HERE.md) | 정규 클래스 폼에 일정 유형(원데이/다회차)과 HTML 상세 업로드 추가 | **완료** (2026-08-03) → [docs/06-admin/07](../docs/06-admin/07-과정-상세본문-HTML과-번들.md) |
| 2 | [02-education-programs-public-pages](02-education-programs-public-pages/00-START-HERE.md) | `/education/programs` 목록·상세 페이지를 DB에 연결해 구현 | **완료** (2026-08-03) → [docs/03-education/13](../docs/03-education/13-공개-과정-상세페이지.md) |
| 3 | [03-regular-class-form-merge](03-regular-class-form-merge/00-START-HERE.md) | 정규 클래스 `new`와 `[id]` 페이지를 하나로 병합 | **완료** → [docs/06-admin/06](../docs/06-admin/06-콘텐츠-폼-공용셸.md) |
| 4 | [04-club-cohort-publish-mismatch](04-club-cohort-publish-mismatch/00-START-HERE.md) | **버그** — 클럽 기수 저장이 없는 `is_published` 컬럼 때문에 실패 | **완료** (2026-08-03) → [docs/06-admin/02 §4.4](../docs/06-admin/02-데이터모델과-RLS.md) |
| 5 | [05-course-bundle-storage](05-course-bundle-storage/00-START-HERE.md) | 상세 자료를 zip으로 올려 Storage에 두고 새 탭으로 연다 | **완료** (2026-08-04, **DDL 적용됨**) → [docs/06-admin/07](../docs/06-admin/07-과정-상세본문-HTML과-번들.md) |

남은 것은 **CSP 검토(G6)**와 어드민 화면 사람 검증 몇 건이다 —
[docs/07-dev/05-남은결정과-작업.md](../docs/07-dev/05-남은결정과-작업.md).

## 셋의 관계 — 실행 순서를 어떻게 잡았나 (기록)

1·2·3은 모두 **정규 클래스(`education_regular_classes`)** 하나를 건드린다.
따로 하면 같은 파일을 세 번 고치게 되므로 순서를 정했다.

```
1. 스키마 · 폼 확장  ──▶  3. 폼 화면 병합  ──▶  2. 공개 페이지
   (컬럼/타입/폼)         (라우트 정리)         (1이 넣은 필드를 화면에 씀)
```

- ~~**1 → 3**~~ — **틀린 판단이었다. 3을 먼저 했다 (2026-08-03).**
  3이 고치는 것은 페이지 껍데기와 신규 셸이고, 1이 고치는 것은 폼 컴포넌트·
  타입·마이그레이션·`actions.ts`다. **소스 파일 교집합이 0**이라 순서가 없다.
  3이 `actions.ts`를 건드리지 않았으므로 1은 지금 그대로 진행하면 된다.
  1을 할 때 폼 페이지 두 개는 이미 `ContentFormShell`을 쓰고 있으니
  [docs/06-admin/06-콘텐츠-폼-공용셸.md](../docs/06-admin/06-콘텐츠-폼-공용셸.md)를 먼저 본다.
- **1 → 2**: 2의 상세 페이지가 보여줄 일정·HTML 본문이 1에서 생긴다. 1 없이
  2를 먼저 하면 상세 페이지를 나중에 다시 열어야 한다.
- 2의 **목록 페이지**만은 1과 독립이다. 급하면 목록부터 먼저 내보낼 수 있다.
- **4는 위 셋과 다른 기능(클럽 기수)이지만 같은 파일**(`content-types.ts`,
  `supabase-content.ts`)을 만진다. 1을 끝낸 뒤에 한다.
- **5는 1이 만든 `detail_html` 경로를 대체하지 않고 옆에 붙는다**(그 폴더 D6).
  1·2가 끝나 있어야 한다 — 어드민 폼과 상세 페이지 양쪽에 붙기 때문이다.
  3과는 같은 라우트 폴더를 쓰지만 폼 본체가 이미 공용 컴포넌트라 순서 제약이 없다.

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
