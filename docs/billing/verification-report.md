# KPOPSOFT Billing Hub 검증 보고서

## 판정

- **로컬 코드 게이트:** `PASS`
- **합성 고객 위젯 브라우저 게이트:** `PASS`
- **격리 Preview DB·배포·기본 라우트:** `PASS`
- **격리 Preview 관리자/결제 게이트:** `HOLD`
- **Production 활성화:** `HOLD`

코드와 합성 브라우저 검증에 더해 의도한 neo 계정의 Vercel Pro 팀, 격리 Neon Preview branch, 결제 마이그레이션·시드, Preview 배포와 fail-closed 기본 라우트를 확인했습니다. Google OAuth, 관리자 브라우저 시나리오, Toss 가맹점/Test·Live 설정, DNS·인증서, 운영 계좌, 고객사 백엔드는 아직 확인되지 않았으므로 운영 배포 완료를 주장하지 않습니다.

## 검증 좌표

| 항목 | 값 |
|---|---|
| 실행 시각 | 2026-07-16 17:13:09 KST |
| 저장소 | `/Users/mac-mini/Documents/kpopsoft-homepage` |
| branch | `codex/kpopsoft-maxonomy-concept-wind` |
| 코드 기준 SHA | `f3bc6a3e252b1a2ddf224190a1a05ccc3cb2d2c4` + 아래 Cron 작업 트리 변경 |
| Neon Preview | `billing-preview-20260716` (`br-lingering-thunder-at6twb35`, 2026-07-23 만료) |
| Preview deployment | `dpl_8G4JWQdvPpZx95TSgRDtY25ttzQZ` |
| Preview pay host | `kpopsoft-billing-preview-neo.vercel.app` |
| Preview admin host | `admin-kpopsoft-billing-preview-neo.vercel.app` |

Preview에는 `0002_billing_foundation.sql` → `0003_billing_payments.sql` → `0004_billing_widget.sql`을 순서대로 적용했고, 결제 관리자와 기본 상품을 시드했습니다. Production Neon branch에는 적용하지 않았습니다.

## Preview 인프라·라우트 확인

| 항목 | 결과 |
|---|---|
| Vercel identity/team | neo 세션의 `kpopsoft@gmail.com`, `kpopsoft-2075s-projects`, Pro |
| Neon identity/project | `kpopsoft@gmail.com`, Vercel 관리 조직, `red-smoke-09462401` |
| Preview schema | 결제 테이블 22, FK 35, index 78; 기존 앱 테이블 DROP 없음 |
| `/pay` | `200` |
| 인증 없는 `/api/pay/session` | `401` |
| 인증 없는 `/api/internal/billing/reconcile` | `401` |
| Preview pay host `/` | `/pay`로 rewrite 후 `200` |
| Preview admin host `/login` | `/admin/login`으로 rewrite 후 `200` |
| Preview admin host 인증 없는 `/` | 같은 호스트의 `/admin/login`으로 `307` |
| Google OAuth callback 계산 | Preview admin host의 `/api/auth/callback/google` |
| Preview error log | smoke 시점 error log 없음 |
| 기능 플래그 | Billing 기반만 ON, 무통장·Toss·위젯 OFF |

Pro 플랜의 분 단위 Cron 조건을 확인해 `/api/internal/billing/reconcile`의 `*/10 * * * *` 설정을 추가했습니다. Cron은 Preview에서 실행되지 않으며 Production DB 마이그레이션, `CRON_SECRET`/`BILLING_CRON_SECRET` 동기 설정과 모니터링 승인 전에는 Production 배포하지 않습니다.

## 전체 로컬 게이트

실행 명령:

```bash
npm test
npm run test:e2e:billing
npm run lint
npx tsc --noEmit
npm run build
npm audit --omit=dev
git diff --check
```

| 명령 | 종료 | 결과 |
|---|---:|---|
| `npm test` | 0 | `246 passed`, 실패·skip 없음 |
| `npm run test:e2e:billing` | 0 | 실제 Chromium `18 passed`, 격리 Preview 전용 `5 skipped` |
| `npm run lint` | 0 | ESLint 오류·경고 없음 |
| `npx tsc --noEmit` | 0 | TypeScript 오류 없음 |
| `npm run build` | 0 | Next.js 16.2.10 webpack Production build 성공, 결제 관리자·pay·Toss·widget·reconcile 라우트 생성 확인 |
| `npm audit --omit=dev` | 0 | Production 의존성 취약점 `0` |
| `git diff --check` | 0 | 공백 오류 없음 |

Next.js 16.2.10 하위의 취약한 PostCSS 고정 버전은 root override로 `postcss@8.5.19`를 사용하게 했고 빌드를 재검증했습니다. 전체 개발 의존성 감사에는 Drizzle Kit의 구형 esbuild loader 경로로 moderate 4건이 남습니다. Production 의존성에는 포함되지 않으며 npm의 자동 수정은 Drizzle Kit를 역다운그레이드하므로 적용하지 않았습니다. 개발 DB 도구를 외부 네트워크에 노출하지 않고 후속 Drizzle Kit 릴리스에서 재검토합니다.

## 확인된 범위

- 고객사·사이트·계약·청구서 생성, 상태, 금액 재계산, 승인, 감사, 이메일 대기열 계약
- 정확 금액 무통장 확인과 관리자 최근 재인증 경계
- Toss 주문·승인·조회·웹훅·재조정·전체/부분 환불의 멱등 및 불명확 상태 보존
- 신규 Toss 진입 차단 중에도 서버 키를 유지해 웹훅·재조정·환불을 복구하는 롤백 계약
- 위젯 HMAC 토큰의 issuer/audience/site/key version/120초/origin/replay 검증
- 단일 사용 handoff, host-only 암호화 결제 세션, customer/site 범위
- www/pay/admin.pay Proxy 분리와 광범위 cookie Domain 금지
- 위젯 Web Component의 dependency-free/version-pinned/immutable 배포 계약
- 390px·1280px의 준비/예정/결제/연체/완료/없음 상태, 오류 비공개, 44px 버튼, overflow, 키보드 초점
- 최상위 handoff 이동과 두 번째 사용 거부 UI
- 관리자 운영 집계가 건수와 마지막 실행 시각만 노출하고 연락처·paymentKey·비밀키·원문 오류를 선택하지 않는 계약

## Preview 전용 브라우저 시나리오

다음 5개 시나리오는 테스트 코드가 존재하지만 `BILLING_E2E_DISPOSABLE_PREVIEW=true`와 격리 fixture가 없으면 강제로 skip합니다.

1. 합성 청구 초안 검토·승인
2. 합성 무통장 확인과 결제 운영 큐
3. 환불 확인 다이얼로그와 합성 환불
4. 결제 세션별 청구 범위와 미설정 계좌 비노출
5. Toss Test 키 기반 성공·취소·실패 fixture

운영 DB를 대상으로 자동 실행하지 않았으며 이 범위는 `HOLD`입니다.

## 외부 HOLD

| 항목 | 해제 증거 |
|---|---|
| Toss 가맹점 | 심사·계약 결제수단, Test/Live client/secret와 정확한 MID 확인 |
| Toss 웹훅 | 등록 URL, Test 전송·재전송, Payment API 대조 결과 |
| 결제 도메인 | `pay.kpopsoft.com`, `admin.pay.kpopsoft.com` DNS·TLS·호스트 라우팅 증거 |
| 운영 무통장 계좌 | 재무 승인자의 은행·번호·예금주 교차 검증 |
| 고객사 사이트 | 서버 백엔드 접근, 로그인 인증 토큰 endpoint, exact origin, staging smoke |
| Production 관리자 | Google OAuth client/secret, callback, 계정과 2FA, 결제 역할, 최근 재인증 증거 |
| Preview 운영 흐름 | Google OAuth 설정 후 합성 고객사·계약·청구 승인·입금 확인 브라우저 증거 |
| Production DB/Cron | 복구 지점, `0002 -> 0003 -> 0004`, `CRON_SECRET`/`BILLING_CRON_SECRET`, 첫 실행 모니터링 |
| 실제 결제 | 승인된 소액 Live 결제·전체 취소와 24시간 큐 관찰 |

모든 HOLD가 해제되기 전에는 Production 기능 플래그를 켜지 않습니다.
