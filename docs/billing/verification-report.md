# KPOPSOFT Billing Hub 검증 보고서

## 판정

- **로컬 코드 게이트:** `PASS`
- **합성 고객 위젯 브라우저 게이트:** `PASS`
- **격리 Preview 관리자/결제 게이트:** `HOLD`
- **Production 활성화:** `HOLD`

코드와 합성 브라우저 검증은 완료했지만 외부 DB, Vercel 소유 계정, Toss 가맹점/Test·Live 설정, DNS·인증서, 운영 계좌, 고객사 백엔드가 확인되지 않았습니다. 따라서 이 보고서는 운영 배포 완료를 주장하지 않습니다.

## 검증 좌표

| 항목 | 값 |
|---|---|
| 실행 시각 | 2026-07-16 12:14:42 KST |
| 저장소 | `/Users/mac-mini/Documents/kpopsoft-homepage` |
| branch | `codex/kpopsoft-maxonomy-concept-wind` |
| 코드 기준 SHA | `fd76a74a60c4bdbc6c0cea14ffadc89b0568720f` |
| DB/배포 변경 | 없음 |

기준 SHA 이후의 변경은 이 보고서·런북·개발 상태 문서뿐입니다.

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
| 의도한 Vercel 계정·팀·프로젝트 | 로그인 identity, project 연결, Preview deployment ID |
| Vercel cron 적합성 | 연결 플랜 확인, 10분 일정 허용 증거, cron 롤백 절차 승인 |
| 격리 Neon Preview | branch ID, 복구 지점, `0002 -> 0003 -> 0004` 적용·복원 증거 |
| Toss 가맹점 | 심사·계약 결제수단, Test/Live client/secret와 정확한 MID 확인 |
| Toss 웹훅 | 등록 URL, Test 전송·재전송, Payment API 대조 결과 |
| 결제 도메인 | `pay.kpopsoft.com`, `admin.pay.kpopsoft.com` DNS·TLS·호스트 라우팅 증거 |
| 운영 무통장 계좌 | 재무 승인자의 은행·번호·예금주 교차 검증 |
| 고객사 사이트 | 서버 백엔드 접근, 로그인 인증 토큰 endpoint, exact origin, staging smoke |
| Production 관리자 | Google 계정과 2FA, 결제 역할, 최근 재인증 증거 |
| 실제 결제 | 승인된 소액 Live 결제·전체 취소와 24시간 큐 관찰 |

모든 HOLD가 해제되기 전에는 Production 기능 플래그를 켜지 않습니다.
