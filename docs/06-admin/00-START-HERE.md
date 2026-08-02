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

## 지금 어디까지 됐나

| 단계 | 상태 |
|------|------|
| P1 — 로그인, 대시보드, 문의 목록·상세·상태/메모 | 완료 |
| P2 — 콘텐츠 CRUD(work/testimonials/experts/stats/inquiry-options) | 완료 |
| ver3 반영 — 프로그램 3분류 2단 구조, 갤러리, 별점, 통계바 | **미구현 (범위 밖)** |
| 관리자 초대 UI | 미구현 |
| Supabase Auth / DB | 연결됨 |
| Storage / 이메일 발송 | 미연결 |

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
- 미착수 백로그 — [../../backlogs/00-START-HERE.md](../../backlogs/00-START-HERE.md)

← [문서 전체 시작점](../00-START-HERE.md)
