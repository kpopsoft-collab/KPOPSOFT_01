# 08. 콘텐츠 폼 `new` · `[id]` 라우트 병합

`/admin/content/**`에 남아 있는 **추가/수정 두 파일 11쌍**을 `[id]` 한 파일로 합친다.

`id === "new"`면 추가, 아니면 수정. 정규 클래스가 이미 쓰고 있는 방식
(`education/regular-classes/[id]/page.tsx`)을 나머지로 넓히는 작업이다.

## 읽는 순서

1. [01-요구사항.md](01-요구사항.md) — 무엇을 합치고 무엇을 남기나
2. [02-현황분석.md](02-현황분석.md) — 11쌍의 실측 차이, **옛 근거 재검증**
3. [03-병합범위-결정.md](03-병합범위-결정.md) — 이 작업의 기준 문서. 버린 대안
4. [04-구현계획.md](04-구현계획.md) — 3단계와 그 순서인 이유
5. [05-검증체크리스트.md](05-검증체크리스트.md)
6. `06-구현결과.md` — 끝난 뒤에 쓴다

## ⚠️ 먼저 알아야 할 것 — 이건 **재판정**이다

같은 질문이 2026-08-03~04에 한 번 판정났고, 그때 결론은 **"합치지 않는다"**였다.

- 원본 판단 — [`docs/08-decisions/03-regular-class-form-merge/`](../03-regular-class-form-merge/00-START-HERE.md) D1·D2
- 승격된 기준 — [`docs/06-admin/06-콘텐츠-폼-공용셸.md`](../../06-admin/06-콘텐츠-폼-공용셸.md) §3
  > "새 콘텐츠 폼은 `new/` + `[id]/` 두 파일로 만든다. 정규 클래스는 예외이지 기준이 아니다."
- 코드에도 박혀 있다 — `src/components/admin/content/content-form-shell.tsx:16`
  > "라우트는 합치지 않는다 — `/new`와 `/[id]`는 하는 일이 다르고(조회 유무), 그 차이는 파일 경로에서 읽히는 편이 낫다."

**CLAUDE.md 규칙상 문서가 코드보다 우선**이므로, 코드만 고치면 다음 사람이 문서를
근거로 되돌린다. **위 세 곳을 뒤집는 일이 이 작업의 일부다** (04-구현계획 3단계).

뒤집는 근거는 하나다 — 당시 반대 근거 3개 중 **하나가 지금 사실이 아니다**
(02-현황분석 §4). 나머지 둘은 여전히 유효하고, 그 값을 치르기로 한다(03-결정 D1).

## 결정 요약

| # | 질문 | 결정 |
|---|------|------|
| D1 | 어디까지 합치나 | **10쌍** — 대칭 9쌍 + `past-programs`. `inquiry-options`는 **제외** |
| D2 | URL을 바꾸나 | **안 바꾼다.** `/new` 경로 그대로. 목록 페이지 링크 13곳 무수정 |
| D3 | `new/page.tsx`를 지우나 | **지운다.** 안 지우면 정적 세그먼트가 우선해 `[id]`에 도달조차 안 한다 |
| D4 | `new` 예약 id 제약을 어디에 적나 | **셸 문서 한 곳.** 페이지 주석은 1~2줄 포인터만. 정규 클래스의 20줄 주석을 10곳에 복사하지 않는다 |
| D5 | 커밋 단위 | **3덩이** — 비교육 4쌍 / 교육 5쌍 / `past-programs`+문서. bisect 가능성 유지 |

각 결정의 이유와 버린 대안은 [03-병합범위-결정.md](03-병합범위-결정.md).

## 닿는 파일

**지운다 (10개)**

```
content/  work/new  experts/new  stats/new  pillar-examples/new
content/education/  club-cohorts/new  club-tiers/new  faqs/new
                    reviews/new  stats/new  past-programs/new
```

**고친다 (10개)** — 위 각 쌍의 `[id]/page.tsx`

**문서·주석 (4곳)**

| 파일 | 무엇을 |
|------|--------|
| `src/components/admin/content/content-form-shell.tsx` | 16~18행 주석 교체 |
| `docs/06-admin/06-콘텐츠-폼-공용셸.md` | §2 적용 범위, §3 라우트 병합, §4 표 재작성 |
| `docs/08-decisions/00-START-HERE.md` | **뒤집힌 결정 표**에 "3의 D1·D2" 추가 |
| `docs/07-dev/02-개발상태.md` | 어드민 라우트 구조 언급이 있으면 반영 |

**건드리지 않는다**

- `inquiry-options/{new,[id]}` — 두 화면이 실제로 다르다 (02 §3)
- `pillars/[id]` — 추가 화면이 없다(핵심 비즈니스 카드는 고정 3장)
- `education/org-training/page.tsx` — 싱글턴
- `education/regular-classes/[id]` — 이미 병합돼 있다. 주석만 다듬는다
- `actions.ts` 13개 — `"use server"` 파일은 비동기 함수 외 export를 거부할 수
  있다. 결정기록 03이 같은 이유로 경로 상수 추출을 폐기했다

---

- 다음 → [01-요구사항.md](01-요구사항.md)
- 폴더 규칙 — [`backlogs/README.md`](../../../backlogs/README.md)
