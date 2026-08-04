# 06. 어드민 — 시작점

`/admin` 콘텐츠 관리 도구와 그 뒤의 Supabase 데이터 모델·권한 설계다.
**DB·인증·서버 액션을 건드리는 모든 작업의 기준 문서**이므로 상시 유효하다.

원본: `docs/어드민기획.md`

## 읽는 순서

코드 주석의 `docs/06-admin/ §N`은 아래 § 열로 찾는다.

| # | 문서 | § | 한 줄 |
|---|------|---|-------|
| 1 | [01-목적-범위-라우트.md](01-목적-범위-라우트.md) | §1–3 | 왜 만드는가, 단계별 범위(P1/P2/P3), 라우트 트리 |
| 2 | [02-데이터모델과-RLS.md](02-데이터모델과-RLS.md) | §4, §5 | `inquiries`·콘텐츠 테이블 스키마, 인증/권한, **RLS 정책** |
| 3 | [03-화면설계와-공개사이트-영향.md](03-화면설계와-공개사이트-영향.md) | §6–8 | 화면별 설계, 공개 사이트 변경점, 기술 메모 |
| 4 | [04-결정사항과-착수순서.md](04-결정사항과-착수순서.md) | §9, §10 | 확정 결정·남은 이슈, P1 착수 순서 |
| 5 | [05-구축-실행계획.md](05-구축-실행계획.md) | §11 | 병렬 Wave 배치, **§11.8 DB 제외 선행 구축 모드(현재 채택)** |
| 6 | [06-콘텐츠-폼-공용셸.md](06-콘텐츠-폼-공용셸.md) | — | **콘텐츠 폼 25개가 쓰는 `ContentFormShell`** — 새 폼 화면을 만들 때의 기준 |
| 7 | [07-과정-상세본문-HTML과-번들.md](07-과정-상세본문-HTML과-번들.md) | — | 정규 클래스 상세 본문(HTML 한 장 / zip 번들 **택일**) — 정제·상한·Storage 규칙 |

## 지금 어디까지 됐나

> ⚠️ 아래 원본 문서(01~05)는 **계획 시점 기준**이라 현재 구현과 어긋나는 곳이 있다.
> 실제로 무엇이 있는지는 `src/app/admin/(shell)/content/`의 라우트가 기준이다.

| 단계 | 상태 |
|------|------|
| P1 — 로그인, 대시보드, 문의 목록·상세·상태/메모 | 완료 |
| P2 — 콘텐츠 CRUD `work` · `experts` · `stats` · `inquiry-options` · `pillars` · `pillar-examples` | 완료 |
| P3 — 교육 ver3 `education/{org-training, regular-classes, club-tiers, club-cohorts, past-programs, reviews, faqs, stats}` | 완료 (마이그레이션 `20260802120000_p3_education_ver3.sql`) |
| P4 — 정규 클래스 **일정 유형 + HTML 상세 본문** | 완료 (`20260803090000`, DDL 적용됨) → [07](07-과정-상세본문-HTML과-번들.md) |
| P5 — 정규 클래스 **zip 번들 업로드**(Storage) | 완료 (`20260804090000`·`20260804120000`, DDL 적용됨) → [07](07-과정-상세본문-HTML과-번들.md) |
| 관리자 초대 UI | 미구현 |
| Supabase Auth / DB / Storage | 연결됨 (`20260709131208_p2_storage_buckets.sql`) |
| 이메일 발송 | 코드는 Resend로 구현됨(`src/lib/email.ts`). 실제 발송은 `RESEND_API_KEY` 유무에 달림 |

원본 §11.8의 "DB 제외 선행 구축 모드"는 **끝난 단계**다. 지금 구조는
Supabase 환경변수가 있으면 실제 DB를, 없으면 mock 어댑터로 폴백한다.

`testimonials`·`insights` 어드민 라우트는 **없다** — 후기는 교육 쪽
`education/reviews`로 옮겨갔고 인사이트는 제거됐다.

최신 상태는 [../07-dev/02-개발상태.md](../07-dev/02-개발상태.md)가 기준이다.

## seam(어댑터) 구조 — 여기가 핵심

§11.8에 따라 **데이터와 인증을 어댑터 뒤로 분리**해 두었다.
Supabase를 붙일 때 어댑터 구현만 교체하면 화면은 손대지 않는다.

| 층 | 파일 |
|----|------|
| 문의 데이터 | `src/lib/admin/data.ts` → `supabase-data.ts` |
| 콘텐츠 데이터 | `src/lib/admin/content-data.ts` → `supabase-content.ts` |
| 문의 옵션 | `src/lib/admin/inquiry-options.ts` → `supabase-inquiry-options.ts` |
| 인증 | `src/lib/admin/auth.ts` (dev-bypass) |
| 타입 | `src/lib/admin/types.ts`, `content-types.ts` |
| 공개 사이트 리더 | `src/lib/public-content.ts` |
| Supabase 클라이언트 | `src/lib/supabase/{client,server,public}.ts` |

## ⚠️ 로컬과 배포가 DB를 공유한다

Supabase 프로젝트가 하나다. **어드민에서 콘텐츠를 고치면 즉시
www.kpopsoft.com에 반영된다.** 반면 이미지·코드는 배포되어야 반영된다.
[../07-dev/02-개발상태.md](../07-dev/02-개발상태.md)를 먼저 읽는다.

## 함께 보기

- ver3가 요구한 Admin 변경 목록 — [../01-ia/03-2차범위-admin-확정사항.md](../01-ia/03-2차범위-admin-확정사항.md)
- 교육 Admin 상세 — [../03-education/12-ver3-상세페이지-ver2유지-admin.md](../03-education/12-ver3-상세페이지-ver2유지-admin.md), [../99-archive/education-ver2/21-admin-구성.md](../99-archive/education-ver2/21-admin-구성.md)
- 홈 Admin 연동 원칙(ver2) — [../99-archive/home-ver2/10-제거콘텐츠와-admin연동.md](../99-archive/home-ver2/10-제거콘텐츠와-admin연동.md)
- 문의 유형 DB 현황 — [../01-ia/04-홈-contact-DB-마이그레이션.md](../01-ia/04-홈-contact-DB-마이그레이션.md)
- 백로그(착수 전 조사·결정 기록. 완료분 포함) — [../../backlogs/00-START-HERE.md](../../backlogs/00-START-HERE.md)

← [문서 전체 시작점](../00-START-HERE.md)
