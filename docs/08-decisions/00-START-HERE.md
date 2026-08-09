# 08. 결정 기록 — 시작점

기능 묶음 하나가 폴더 하나이고, 각 폴더의 `00-START-HERE.md`가 그 기능의 시작점이다.
**폴더 안 문서는 번호 순서대로 읽는다.**

## 이 폴더는 무엇인가

**"왜 그렇게 정했나"의 원자료다.** 조사에서 실제로 잰 값, 검토했다가 **버린 대안**,
계획과 달랐던 점, 틀렸다가 고친 판단이 여기 있다.

**"지금 무엇이 어떻게 동작하나"는 여기가 아니라 앞 번호 폴더들(01~07)이 답한다.**
둘이 어긋나면 **앞 번호 폴더가 우선**이고, 여기를 고친다.

> ⚠️ 계획 문서에는 착수 전에 쓴, 구현과 다른 판단이 섞여 있다. 각 폴더의
> **구현 결과 문서를 먼저 본다** — 아래 표 오른쪽 링크다.

이 폴더는 2026-08-05까지 저장소 루트의 `backlogs/`에 있었다. 완료된 것을 문서
트리 밖에 두면 코드 주석이 가리키는 근거가 `docs/` 밖에 놓인다 — 그래서 안으로
옮겼다.

**`backlogs/`는 그대로 있다** — 이제 **진행 중인 작업만** 담는다.
새 기능을 시작하는 절차는 [`../../backlogs/README.md`](../../backlogs/README.md).

### 200줄 규칙의 예외 — 세 파일

`CLAUDE.md`의 "문서 하나는 200줄을 넘지 않는다"를 아래 셋이 어긴다.

| 파일 | 줄 |
|---|---|
| `01-…/03-데이터모델.md` | 230 |
| `01-…/04-구현계획.md` | 312 |
| `02-…/04-구현계획.md` | 237 |

**일부러 쪼개지 않았다.** 이 폴더의 문서는 그때의 판단을 그대로 얼려 둔 기록이라
지금 와서 나누면 두 가지를 잃는다 — 코드 주석이 찍어 둔 절 번호(예: *"04-구현계획
4단계"*)가 다른 파일로 흩어지고, 당시 한 호흡으로 쓴 판단이 끊긴다.

200줄 규칙은 **읽고 고치는 문서**를 위한 것이다. 여기는 고치지 않는다.
새로 쓰는 결정 기록은 규칙을 지킨다.

## 목록 — 전부 완료됨

| # | 폴더 | 한 줄 | 결과 → 상시 기준 문서 |
|---|------|-------|------|
| 1 | [01-regular-class-schedule-and-html](01-regular-class-schedule-and-html/00-START-HERE.md) | 정규 클래스 폼에 일정 유형과 HTML 상세 업로드 추가 | 2026-08-03 → [../06-admin/07](../06-admin/07-과정-상세본문-HTML과-번들.md) |
| 2 | [02-education-programs-public-pages](02-education-programs-public-pages/00-START-HERE.md) | `/education/programs` 목록·상세를 DB에 연결 | 2026-08-03 → [../03-education/13](../03-education/13-공개-과정-상세페이지.md) |
| 3 | [03-regular-class-form-merge](03-regular-class-form-merge/00-START-HERE.md) | 정규 클래스 `new`·`[id]` 페이지 병합 | → [../06-admin/06](../06-admin/06-콘텐츠-폼-공용셸.md) |
| 4 | [04-club-cohort-publish-mismatch](04-club-cohort-publish-mismatch/00-START-HERE.md) | **버그** — 없는 `is_published` 컬럼 때문에 클럽 기수 저장 실패 | 2026-08-03 → [../06-admin/02 §4.4](../06-admin/02-데이터모델과-RLS.md) |
| 5 | [05-course-bundle-storage](05-course-bundle-storage/00-START-HERE.md) | 상세 자료를 zip으로 Storage에 올려 새 탭으로 연다 | 2026-08-04 → [../06-admin/07](../06-admin/07-과정-상세본문-HTML과-번들.md) |
| 6 | [06-course-detail-page-redesign](06-course-detail-page-redesign/00-START-HERE.md) | 상세 페이지 재구성 + 업로드 HTML 인라인 폐지 | 2026-08-05 → [06-구현결과](06-course-detail-page-redesign/06-구현결과.md) · [../03-education/13](../03-education/13-공개-과정-상세페이지.md) |
| 7 | [07-content-security-policy](07-content-security-policy/00-START-HERE.md) | CSP 도입(G6) — nonce 기반, **강제 적용** | 2026-08-06 → [04-강제전환](07-content-security-policy/04-강제전환.md) · [../07-dev/14](../07-dev/14-CSP-정책과-적용.md) |
| 8 | [08-content-form-route-merge](08-content-form-route-merge/00-START-HERE.md) | 콘텐츠 폼 `new`·`[id]` 라우트 10쌍 병합 — **3의 재판정** | 2026-08-06, 검증 08-09 → [06-구현결과](08-content-form-route-merge/06-구현결과.md) · [../06-admin/06](../06-admin/06-콘텐츠-폼-공용셸.md) |

## 뒤집힌 결정 — 앞 문서를 읽을 때 주의

이 폴더의 값어치는 **틀렸던 판단이 남아 있다는 것**이다. 지우지 않고 표시해 둔다.

| 어디 | 무엇이 틀렸나 | 바로잡은 곳 |
|---|---|---|
| 5의 **D4** (우리 도메인 프록시 금지) | 전제였던 "Storage가 격리 origin으로 동작한다"가 거짓 — Storage는 HTML을 `text/plain`으로 내린다 | [6의 03](06-course-detail-page-redesign/03-화면구조-결정.md) D3-정정 |
| 5의 **D6** (HTML·번들 택일 유지) | 인라인 렌더링이 빈 화면을 만들어 `.html`도 번들로 합침 | [6의 01](06-course-detail-page-redesign/01-현황분석-무엇이-깨졌나.md) |
| 5의 **"리스크 1 해소"** | *파일이 올라갔다*까지만 확인하고 **링크를 열어 본 사람이 없었다** | [5의 00](05-course-bundle-storage/00-START-HERE.md) 정정 블록 |
| 7의 **`x-nonce` 설명** | Next는 그 헤더가 아니라 **응답 CSP 헤더를 직접 파싱**한다 | [7의 03](07-content-security-policy/03-구현결과.md) §2-3 |
| 3의 **D1·D2** (라우트를 합치지 않는다) | 비용으로 셌던 *"`/new`가 정적 프리렌더에서 빠진다"*가 거짓 — 어드민은 셸 레이아웃의 `requireAdmin()` 때문에 **원래 전부 동적**이었다. 재 보니 잃는 것이 없어 10쌍을 합쳤다 | [8의 02](08-content-form-route-merge/02-현황분석.md) §4 |

> **교훈 하나만 고르면** — "파일이 올라갔다"를 "화면이 나온다"의 증거로 쓰지 않는다.
> 링크를 만들었으면 그 링크를 연다.

## 남은 일 — **없다**

2026-08-06에 마지막 네 건이 닫혔다.

| 닫힌 것 | 어디에 |
|---|---|
| CSP **강제 전환** (release gate G6 완결) | [7의 04](07-content-security-policy/04-강제전환.md) · [../07-dev/14](../07-dev/14-CSP-정책과-적용.md) |
| CSP 확인 체크리스트 8개 | [../07-dev/14](../07-dev/14-CSP-정책과-적용.md) §5-1 |
| 어드민 회귀 — *이름만 고쳐 저장해도 자료가 남는가* | [../06-admin/07](../06-admin/07-과정-상세본문-HTML과-번들.md) §3-3 |
| `ai-tools` 상세 자료 404 5건 | [../07-dev/05](../07-dev/05-남은결정과-작업.md) |

> **다만 강제 CSP에는 전제가 하나 붙어 있다** — `src/app/layout.tsx`의
> `export const dynamic = "force-dynamic"`. 지우면 정적으로 만들어진 페이지에
> nonce가 안 박혀 그 페이지의 스크립트가 전부 막힌다.

## 새 기능을 시작할 때

**여기가 아니라 [`backlogs/`](../../backlogs/README.md)에서 시작한다.**
끝나면 "지금 어떻게 동작하나"를 앞 번호 폴더의 상시 문서로 올리고, 폴더째
여기로 옮긴다. 절차는 그 README에 있다.

## 공통 배경 — 교육 기능들이 닿는 지점

| 층 | 파일 |
|----|------|
| DB 스키마 | `supabase/migrations/20260802120000_p3_education_ver3.sql` |
| 어드민 타입 | `src/lib/admin/content-types.ts` — `EducationRegularClass` |
| 어드민 매핑 | `src/lib/admin/supabase-content.ts` — `FIELDS.education_regular_classes` |
| 어드민 폼 | `src/components/admin/content/education/regular-classes/regular-class-form.tsx` |
| 어드민 액션 | `src/app/admin/(shell)/content/education/regular-classes/actions.ts` |
| 공개 타입·폴백 | `src/lib/education-content.ts` |
| 공개 리더 | `src/lib/public-content.ts` |
| 공개 화면 | `src/app/education/programs/` |

**필드 하나를 늘리면 위 7~8곳이 같이 움직인다.**

---

← [문서 전체 시작점](../00-START-HERE.md)
