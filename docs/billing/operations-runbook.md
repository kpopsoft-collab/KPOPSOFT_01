# KPOPSOFT Billing Hub 운영 런북

상태 기준일: 2026-07-16

이 문서는 Preview 검증과 Production 운영 절차입니다. 환경변수 **이름만** 기록하며 값, 인증 코드, paymentKey, 전체 계좌번호, 고객 연락처는 티켓·채팅·로그에 복사하지 않습니다. 외부 계정·격리 DB·승인 증거가 없는 단계는 `HOLD`입니다.

## 1. 역할과 승인 경계

| 역할 | 책임 |
|---|---|
| 배포 책임자 | 의도한 Vercel 팀·프로젝트·브랜치 확인, 환경변수 연결, Preview/Production 배포와 롤백 |
| DB 책임자 | Neon 대상 branch 확인, 복구 지점 생성, 마이그레이션·복구 증거 보관 |
| 결제 운영자 | 청구 승인, 입금 확인, 결제·웹훅·환불 큐 모니터링 |
| 재무 승인자 | 운영 계좌 검증, 소액 결제·취소 승인, 중복/오입금 판단 |
| 보안 책임자 | 비밀키 발급·회전·폐기, 사고 시 세션과 키 무효화 |
| Toss 담당자 | 가맹점 심사, Test/Live 키·MID·웹훅 등록, 공급자 문의 |

고위험 작업은 Auth.js Google 로그인 시각 기준 15분 이내 재인증과 해당 결제 역할을 요구합니다. 운영 DB 콘솔에서 상태를 직접 수정하지 않습니다.

## 2. 환경변수 소유권

### 플랫폼·인증

| 이름 | 소유 역할 | 용도 |
|---|---|---|
| `DATABASE_URL` | DB 책임자 | 환경별 Neon branch 연결 |
| `AUTH_SECRET`, `AUTH_GOOGLE_ID`, `AUTH_GOOGLE_SECRET` | 보안 책임자 | 관리자 Auth.js 로그인 |
| `ADMIN_SEED_EMAILS`, `BILLING_ADMIN_SEED_EMAILS` | 보안·결제 운영자 공동 | 명시적 관리자/결제 최고관리자 시드 |
| `BILLING_ENABLED`, `BILLING_CRON_SECRET` | 배포 책임자 | 결제 기반과 내부 작업 인증 |
| `BILLING_NOTIFICATION_FROM` | 배포 책임자 | 청구 알림 발신자 |

### 무통장·Toss

| 이름 | 소유 역할 | 용도 |
|---|---|---|
| `BANK_TRANSFER_ENABLED` | 재무 승인자 | 신규 무통장 안내 노출 |
| `BANK_ACCOUNT_BANK`, `BANK_ACCOUNT_NUMBER`, `BANK_ACCOUNT_HOLDER` | 재무 승인자 | 고객에게 표시할 운영 계좌 |
| `TOSS_PAYMENTS_ENABLED` | 결제 운영자 | 신규 Toss 결제 진입·주문 생성 |
| `TOSS_PAYMENTS_CLIENT_KEY` | Toss 담당자 | 보호된 결제 페이지에만 전달되는 SDK 키 |
| `TOSS_PAYMENTS_SECRET_KEY`, `TOSS_PAYMENTS_MID` | Toss 담당자 | 서버 승인·조회·취소·복구 |
| `TOSS_PAYMENTS_API_BASE` | 배포 책임자 | Production은 공식 API origin만 허용 |

`TOSS_PAYMENTS_ENABLED=false`여도 서버 키·MID를 유지하면 이미 생성된 시도의 승인 확인, 웹훅, 재조정, 환불 복구는 계속됩니다. 사고 중에는 키를 먼저 삭제하지 않습니다.

### 위젯·호스트

| 이름 | 소유 역할 | 용도 |
|---|---|---|
| `BILLING_WIDGET_ENABLED` | 결제 운영자 | 고객사 위젯 API 활성화 |
| `BILLING_WIDGET_MASTER_KEY` | 보안 책임자 | 사이트별 위젯 비밀키 봉인 |
| `BILLING_RATE_LIMIT_HASH_KEY` | 보안 책임자 | rate limit 식별자 해시 |
| `BILLING_PAY_SESSION_KEY` | 보안 책임자 | 결제 세션 쿠키 암호화·인증 |
| `BILLING_WIDGET_ISSUER` | 배포 책임자 | 정확한 `https://pay...` origin |
| `BILLING_WIDGET_AUDIENCE` | 배포 책임자 | 고정값 `kpopsoft-billing-widget` |
| `BILLING_WWW_HOST`, `BILLING_PAY_HOST`, `BILLING_ADMIN_HOST` | 배포 책임자 | www/pay/admin.pay 호스트 경계 |

세 개의 32바이트 위젯·rate limit·결제 세션 키는 서로 달라야 합니다. 고객사별 발급 비밀키는 고객사 서버 환경변수에만 저장합니다.

## 3. Preview 준비와 마이그레이션

1. Vercel CLI/대시보드에서 의도한 팀, 프로젝트, Git branch를 확인하고 증거를 남깁니다.
2. Production과 분리된 Neon Preview branch를 만들고 branch ID와 생성 시각을 변경 기록에 남깁니다.
3. 마이그레이션 직전 Neon 복구 지점 또는 원본 branch를 보존합니다. 실제 복원 절차와 복원 담당자를 기록하지 못하면 `HOLD`입니다.
4. `DATABASE_URL`이 Preview branch를 가리키는지 호스트·DB명만 교차 확인합니다. URL 전체를 출력하지 않습니다.
5. `schema_migrations`와 테이블 목록을 확인한 뒤 다음 additive 순서로 적용합니다.

```text
database/migrations/0002_billing_foundation.sql
database/migrations/0003_billing_payments.sql
database/migrations/0004_billing_widget.sql
```

6. `npm run db:migrate` 완료 후 세 파일의 적용 시각, schema 검사, 기본 홈페이지/문의/관리자 smoke 결과를 기록합니다.
7. 실패하면 추가 SQL로 임의 수정하지 말고 배포를 중지합니다. Preview branch를 폐기하고 보존한 복구 지점에서 다시 시작합니다.

Production에서는 같은 복구 지점·적용 순서·검증표가 승인된 뒤에만 마이그레이션합니다.

## 4. 기능 활성화 순서

첫 Preview 배포는 다음 진입 상태로 시작합니다.

```text
BILLING_ENABLED=true
BANK_TRANSFER_ENABLED=false
TOSS_PAYMENTS_ENABLED=false
BILLING_WIDGET_ENABLED=false
```

1. 결제 관리자 역할과 계약·청구 관리자 화면만 확인합니다.
2. 합성 고객사 → 계약 초안 → 활성화 → 자동 청구 초안 → 승인 흐름을 확인합니다.
3. 재무 승인자가 계좌 표시값을 교차 검증한 뒤 무통장만 켜고 정확 금액 입금 확인을 리허설합니다.
4. Preview 전용 Toss Test 키·MID·웹훅을 등록하고 성공, 취소, 실패, 변조, 중복, 지연, 전체·부분 취소를 검증한 뒤 Toss 신규 진입을 켭니다.
5. staging 고객사 한 곳의 정확한 origin과 서버 토큰 엔드포인트를 확인한 뒤 위젯을 켭니다.
6. 각 단계 사이에 운영 큐와 감사 로그를 확인합니다. 한 번에 두 진입 수단을 새로 켜지 않습니다.

## 5. 도메인·DNS·인증서

검증 대상은 `pay.kpopsoft.com`, `admin.pay.kpopsoft.com`과 현재 www host입니다.

- DNS가 의도한 Vercel 프로젝트를 가리키는지 확인합니다.
- 세 호스트의 인증서 SAN, 만료일, HTTPS 강제 여부를 확인합니다.
- www의 결제 경로는 pay host로, 관리자 결제 경로는 admin.pay host로 이동하는지 확인합니다.
- pay host에서 관리자 경로가 열리지 않고 admin.pay host에서 고객 결제 경로가 열리지 않는지 확인합니다.
- 쿠키에 광범위한 `Domain=.kpopsoft.com`이 없고 결제 세션이 host-only, Secure, HttpOnly, SameSite=Lax인지 확인합니다.

## 6. Toss 웹훅과 재조정

1. Toss Test 콘솔에 `POST https://pay.kpopsoft.com/api/payments/toss/webhook`을 등록합니다.
2. Test 결제 후 웹훅 receipt가 먼저 저장되고 Payment API 재조회 뒤 `DONE`이 되는지 확인합니다.
3. 같은 전송 재전송은 중복 결제 없이 멱등 처리되어야 합니다.
4. `RETRY`가 남으면 `/admin/billing/payments`에서 건수와 제한된 오류 코드만 확인합니다. 공급자 원문이나 전체 paymentKey를 티켓에 붙이지 않습니다.
5. `/api/internal/billing/reconcile`은 보호된 운영 실행기에서 `Authorization: Bearer BILLING_CRON_SECRET`으로 수동 실행할 수 있습니다. 응답의 claimed/applied/retry 건수만 기록합니다.
6. 연결된 Vercel 플랜과 일정 적합성이 확인되기 전에는 10분 cron을 추가하지 않습니다.

현재 Vercel의 [Cron 관리 문서](https://vercel.com/docs/cron-jobs/manage-cron-jobs)는 Instant Rollback 시 활성 cron이 자동 갱신되지 않을 수 있다고 명시합니다. 코드 롤백과 별개로 Cron Jobs 화면에서 일정을 직접 비활성화·확인하고, 변경은 설정 수정 후 재배포합니다.

## 7. 운영 큐 처리

| 큐 | 판단·조치 |
|---|---|
| 승인 대기 초안 | 계약·기간·금액 스냅샷을 검토하고 최근 재인증 후 승인 또는 무효화 |
| 연체 청구 | 실제 결제·입금증·고객 공지를 확인하고 상태를 임의 수정하지 않음 |
| `CONFIRMING` 15분 초과 | Toss 조회와 재조정을 실행하고 결과가 불명확하면 신규 결제 진입을 중지 |
| 웹훅 `RETRY` | receipt·전송 ID·제한 오류 코드로 공급자 상태 재조회, 재전송 시 중복 여부 확인 |
| 환불 `PROCESSING` | Toss 취소 내역과 내부 잔액을 재조회해 완료 또는 계속 복구 대상으로 유지 |
| 환불 `FAILED` | 거절 코드와 잔액을 확인하고 같은 멱등 키를 임의 교체하지 않음 |
| 전송 실패 | 수신 동의·발신 도메인 상태를 확인해 승인된 재시도 경로 사용 |

대시보드와 로그에는 건수, correlationId, 해시된 invoice 식별자, attempt ID, 제한된 errorCode만 사용합니다.

## 8. 위젯 키 수명주기

- **생성:** 활성 사이트의 정확한 HTTPS origin으로 한 번 생성합니다. 공개 ID와 삽입 HTML은 복사할 수 있지만 비밀키는 생성 직후 한 번만 표시합니다.
- **검증:** 고객사 서버가 기존 로그인 세션을 인증하고 120초 이하 토큰을 발급하는지 확인합니다.
- **회전:** 고객사 배포 창을 확보하고 새 비밀키를 받을 담당자를 확인한 뒤 실행합니다. 기존 비밀키는 즉시 무효가 되므로 고객사 서버 환경변수를 즉시 교체하고 smoke합니다.
- **비활성화:** 고객사 침해, origin 이전, 계약 종료 시 즉시 비활성화합니다. 기존 토큰도 거부되는지 확인합니다.
- **master key 침해:** `BILLING_WIDGET_ENABLED=false`로 차단하고 보안 책임자에게 에스컬레이션합니다. master key만 바꾸면 기존 암호문을 복호화할 수 없으므로, 승인된 재암호화 또는 전 사이트 비밀키 재발급 절차 없이는 변경하지 않습니다.

## 9. 사고·롤백 절차

### 공급자 장애 또는 신규 결제 중지

1. `TOSS_PAYMENTS_ENABLED=false`로 신규 Toss 버튼과 주문 생성을 막습니다.
2. `TOSS_PAYMENTS_SECRET_KEY`, `TOSS_PAYMENTS_MID`, API base는 유지해 기존 웹훅·재조정·환불을 계속 처리합니다.
3. 무통장 대체를 사용할 때만 재무 승인 후 `BANK_TRANSFER_ENABLED=true`로 전환합니다.
4. `CONFIRMING`, 웹훅 `RETRY`, 환불 `PROCESSING`이 0이 될 때까지 모니터링합니다.

### 중복 결제 의심

신규 진입을 중지하고 invoice, attempt, payment, provider transaction을 correlation ID로 대조합니다. DB 행을 삭제하거나 두 번째 결제를 임의 성공 처리하지 않습니다. 재무 승인 후 공급자 취소 경로로만 환불하고 감사 증거를 남깁니다.

### 잘못 확인한 무통장 입금

무통장 진입을 중지하고 입금증·은행 원장·관리자 감사 로그를 보존합니다. 청구/결제 행을 삭제하거나 상태를 직접 되돌리지 않습니다. 재무가 실제 반환 이체를 승인하고, 시스템 내 보정이 필요하면 별도 검토·배포되는 감사 가능한 보상 명령이 준비될 때까지 해당 건을 `HOLD`합니다.

### 멈춘 환불

내부 잔액과 Toss 취소 가능 잔액을 먼저 비교하고 재조정을 실행합니다. 시간초과를 성공으로 간주하지 않습니다. 공급자 결과가 불명확하면 `PROCESSING`을 유지하고 Toss 담당자가 transaction key 기준으로 문의합니다.

### 비밀키 노출

노출 범위를 구분해 해당 진입을 중지하고 Vercel 환경변수 접근 로그와 감사 로그를 보존합니다. Toss 키는 공급자 콘솔에서 회전하고 배포한 뒤 Test 승인·조회·취소를 다시 검증합니다. 결제 세션 키 노출 시 기존 세션을 무효화하고, 위젯 사이트 키 노출 시 해당 연동만 회전 또는 비활성화합니다. 실제 값은 사고 티켓에도 남기지 않습니다.

### 애플리케이션 롤백

배포 책임자가 직전 정상 배포로 트래픽을 되돌린 뒤 홈페이지·관리자·pay·웹훅을 smoke합니다. DB는 additive migration이므로 애플리케이션 롤백만으로 스키마를 삭제하지 않습니다. Cron Jobs 화면에서 활성 일정을 별도로 확인·비활성화하고, 신규 결제를 막아도 웹훅과 재조정은 유지합니다.

## 10. 증거와 에스컬레이션

각 변경은 다음 항목을 한 묶음으로 보관합니다.

- 변경자 역할, 승인자 역할, 시각, commit SHA, 배포 ID
- 대상 환경과 Neon branch ID, 마이그레이션 파일/적용 시각, 복구 지점
- 기능 플래그의 이름과 on/off 상태(값이 비밀인 변수는 기록하지 않음)
- 합성 invoice/attempt/correlation ID와 PASS/HOLD/FAIL
- 큐 건수 전후, 웹훅 재전송 결과, 롤백 판단

에스컬레이션 순서는 결제 운영자 → 재무 승인자 → 배포/DB 책임자 → 보안 책임자 → Toss/Vercel 지원 담당 역할입니다. 개인 인증정보나 비밀키 대신 프로젝트·배포·전송·상관 식별자만 공유합니다.
