# 04. 클럽 기수 — 없는 `is_published` 컬럼에 쓰는 문제

어드민의 **클럽 기수(`education_club_cohorts`) 추가·수정·공개토글이
실제 Supabase 모드에서 실패한다.** 앱은 `is_published` 컬럼에 쓰려 하는데
그 테이블에는 그 컬럼이 없다.

[01](../01-regular-class-schedule-and-html/00-START-HERE.md) 작업 중
`FIELDS` projection을 검토하다 발견했다(그 폴더 `06-교차검증-결과.md` §4).
**01과 무관하게 이미 존재하던 버그**라 따로 뗐다.

## 읽는 순서

1. [01-원인분석.md](01-원인분석.md) — 무엇이 어디서 어긋나는가
2. [02-수정계획.md](02-수정계획.md) — 두 방향과 권장안, 검증

## 증상

| 하는 일 | 지금 결과 |
|---------|-----------|
| 기수 **추가** 저장 | 실패 (PostgREST가 없는 컬럼을 거부) |
| 기수 **수정** 저장 | 실패 |
| 목록의 **공개/비공개 토글** | 실패 |
| 기수 **목록 조회** | 정상 — `fromRow()`가 없는 컬럼을 조용히 건너뛴다 |
| 시드 스크립트(`scripts/seed-education-ver3.cjs`) | **정상** — 컬럼을 손으로 나열하며 `is_published`를 빼고 있다(`:89~104`) |
| 공개 `/education` 표시 | 정상 — 어드민을 안 거치는 경로다 |

**읽기가 멀쩡해서 화면상으로는 문제가 안 보인다.** 저장을 눌러야 드러난다.

> 시드 스크립트가 `is_published` **없이** 기수를 넣는다는 사실이 중요하다.
> `FIELDS` 매핑을 안 타고 컬럼을 직접 적는데, 거기엔 이 컬럼이 없다.
> 스키마와 시드는 서로 맞고 **어드민 타입만 어긋나 있다**는 증거다 →
> [02](02-수정계획.md) 안 A의 근거.

## 착수 전 확인 — **2026-08-03 운영 DB로 확정됨**

마이그레이션 파일 기준 추론이었던 것을 실제 DB에 붙어 확인했다. 진단이 맞다.

```
컬럼 목록: id, label, status, recruit_period, run_period, price, list_price,
          capacity, note, cta_disabled, show_price, show_capacity,
          show_schedule, show_cta, sort_order, created_at, updated_at
          → is_published 없음

select is_published → column education_club_cohorts.is_published does not exist
update is_published → PGRST204 Could not find the 'is_published' column
```

- **컬럼이 실재하지 않는다.** 수동으로 추가된 적도 없다(스키마 드리프트 아님)
- **쓰기가 실제로 거부된다.** 예상한 `PGRST204` 그대로다
- 기수 **4행이 들어 있다** — 시드 스크립트(`seed-education-ver3.cjs`)가 돌았다는 뜻이고,
  그 스크립트가 `is_published` 없이 넣는다는 §1-5의 근거와 일치한다

→ [02-수정계획.md](02-수정계획.md) 안 A로 그대로 간다. 0단계(DB 확인)는 끝났다.

## 결정이 필요한 것

| # | 질문 | 기본안 |
|---|------|--------|
| D1 | DB에 컬럼을 **추가**할지, 앱에서 **걷어낼**지 | **걷어낸다.** 기수를 숨기는 축은 이미 `status`다 → [02](02-수정계획.md) §1 |
| D2 | 다른 테이블에도 같은 어긋남이 있는지 | 없다. 전수 확인함 → [01](01-원인분석.md) §3 |
