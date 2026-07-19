# KPOPSOFT Platform Integration Orchestration Design

- 작성일: 2026-07-19
- 상태: 사용자 승인 방향 반영
- 홈페이지·어드민 저장소: `/Users/mac-mini/Documents/kpopsoft-homepage`
- 내부 허브 저장소: `/Users/mac-mini/Documents/kpopsoft-hub`
- 비작업 저장소: `/Users/mac-mini/Documents/ai협업`

## 1. 목적

기존 Billing Hub 작업과 승인된 Linear, Google Drive, CRM, 내부 Hub 연동
설계를 하나의 실행 로드맵으로 묶는다. 하나의 거대 변경으로 합치지 않고
기능 트랙을 독립적으로 구현·검증한 뒤, 명시된 API 계약과 배포 순서에서만
결합한다.

이 문서는 다음 두 설계를 대체하지 않는다.

- `docs/superpowers/specs/2026-07-15-kpopsoft-billing-hub-design.md`
- `docs/superpowers/specs/2026-07-19-kpopsoft-integrated-operations-design.md`

두 설계가 충돌하지 않도록 실행 순서와 저장소 경계를 정의하는 상위
오케스트레이션 문서다.

## 2. 확정된 실행 원칙

### 2.1 저장소를 섞지 않는다

`kpopsoft-homepage`와 `kpopsoft-hub`는 서로 다른 Git 저장소로 유지한다.
한 저장소의 파일을 다른 저장소에 복사하거나 한 커밋에서 두 저장소를
동시에 다루지 않는다. `/Users/mac-mini/Documents/ai협업`에는 이 작업의
코드·마이그레이션·문서를 복사하지 않는다.

교차 저장소 기능은 다음 증거로 연결한다.

- 버전이 있는 내부 API 계약
- 홈페이지 commit SHA
- Hub commit SHA
- 각 앱 Preview deployment ID
- Neon migration 번호
- Supabase migration timestamp
- 기능 플래그 상태

### 2.2 현재 작업 트리를 보호한다

홈페이지 저장소의 현재 기준선은 다음과 같다.

- branch: `codex/kpopsoft-maxonomy-concept-wind`
- HEAD: `599cf3a364215a3db38280e58b264c502e0066ad`
- origin보다 33 commit 앞선 상태

다음 네 파일의 기존 미커밋 변경은 Billing Preview 검증 작업이다.

- `docs/billing/verification-report.md`
- `docs/개발상태.md`
- `tests/billing-cron-route.test.mts`
- `vercel.json`

이 변경은 전체 로컬 게이트를 다시 통과한 뒤 정확히 네 파일만
`chore: record billing preview readiness` 커밋으로 묶는다. 그 전에는
reset, checkout, stash, 자동 포맷, 광범위 stage를 하지 않는다.

Hub 저장소 기준선은 다음과 같다.

- branch: `codex/production-readiness`
- HEAD: `94a0f83`
- 현재 작업 트리: clean

### 2.3 구현은 기능 트랙별 worktree에서 수행한다

기준선 커밋 후 `superpowers:using-git-worktrees`를 사용한다. 홈페이지와
Hub 모두 기능 트랙마다 별도 `codex/` branch와 worktree를 만든다.

홈페이지 트랙:

1. `codex/billing-preview-oauth`
2. `codex/integration-foundation-linear-mirror`
3. `codex/linear-commands-project-mobility`
4. `codex/google-drive-project-sync`
5. `codex/crm-project-conversion`
6. `codex/billing-summary-security-rollout`

Hub 트랙:

1. `codex/hub-linear-mirror`
2. `codex/hub-linear-commands`
3. `codex/hub-drive-project-data`
4. `codex/hub-crm-billing-summary`

트랙 간 결합은 검증된 commit을 상위 통합 branch로 순서대로 merge한다.
한 트랙의 미완성 작업을 다른 트랙에 cherry-pick하지 않는다. 두 저장소
사이에서는 commit을 cherry-pick하지 않는다.

## 3. 데이터 및 기능 소유권

| 기능 | 원본 시스템 | 읽기 또는 명령 소비자 |
|---|---|---|
| 고객·문의·상담 | 홈페이지 어드민 / Neon | Hub 프로젝트 연결 |
| 계약·청구·결제·환불 | Billing Hub / Neon | Hub 읽기 전용 요약 |
| 프로젝트·참여자·일정·정산 | Hub / Supabase | 어드민 연결 상태 |
| 업무·담당자·우선순위·진행률 | Linear | Hub 미러와 제한 명령 |
| 폴더·파일 메타데이터 | Google Shared Drive | Hub 자료 탭 |
| 외부 연동 receipt·작업함 | 홈페이지 어드민 / Neon | 어드민 운영 화면 |

Hub는 계약·청구·결제·환불을 변경하지 않는다. Billing 코드는 Linear 또는
Drive 비밀값을 읽지 않는다. 외부 공급자 비밀값은 홈페이지 Vercel
서버에만 존재한다.

## 4. 교차 저장소 계약

### 4.1 계약 버전

첫 내부 계약 버전은 `2026-07-19.v1`이다. 모든 내부 요청은 다음 헤더를
가진다.

- `x-kpopsoft-contract-version`
- `x-kpopsoft-key-id`
- `x-kpopsoft-timestamp`
- `x-kpopsoft-nonce`
- `x-kpopsoft-idempotency-key`
- `x-kpopsoft-signature`

서명 원문은 HTTP method, canonical path, timestamp, nonce, body SHA-256을
줄바꿈으로 결합한다. 방향별 키를 분리한다.

- `ADMIN_TO_HUB_HMAC_KEYS`
- `HUB_TO_ADMIN_HMAC_KEYS`

키는 `keyId:base64Secret` 목록으로 관리하고 활성 signing key ID를 별도로
둔다. raw key, OAuth token, 전체 서명 원문은 로그에 남기지 않는다.

### 4.2 이벤트 봉투

어드민에서 Hub로 보내는 모든 미러 이벤트는 다음 구조를 사용한다.

```ts
type IntegrationEventEnvelope<T> = {
  contractVersion: "2026-07-19.v1";
  eventId: string;
  eventType: string;
  occurredAt: string;
  source: "linear" | "drive" | "admin" | "billing";
  aggregateId: string;
  payload: T;
};
```

Hub는 service-role이 필요한 서버 전용 Route Handler에서만 이벤트를 받고,
`eventId`와 nonce를 Supabase unique constraint로 중복 차단한다. 브라우저
번들에는 service-role key와 HMAC key가 들어가지 않는다.

### 4.3 명령과 확정

Hub의 Linear 명령은 즉시 성공으로 표시하지 않는다.

1. Hub가 어드민 명령 API에 서명 요청을 보낸다.
2. 어드민은 작업함에 멱등 command를 기록한다.
3. 어드민이 Linear API를 호출한다.
4. Linear webhook 또는 정합성 조회가 최종 상태를 확인한다.
5. 어드민이 Hub 미러 이벤트를 보낸다.
6. Hub는 `pending`을 실제 Linear 상태로 교체한다.

## 5. 통합 실행 순서

### Phase 0. 기준선 동결

1. 홈페이지 미커밋 Billing 네 파일을 재검증한다.
2. 네 파일만 독립 커밋한다.
3. 두 저장소의 branch, HEAD, remote, worktree 상태를 기록한다.
4. 기능 트랙별 worktree를 만든다.
5. Preview와 Production 환경변수 범위를 다시 확인한다.

### Phase 1. Billing Preview 접근 복구

Billing Preview branch
`br-lingering-thunder-at6twb35`의 만료 시각은
`2026-07-23T08:00:00Z`다. 작업 시작 시 `ready`와 남은 시간을 다시
확인한다.

Google OAuth는 Preview에만 먼저 연결한다.

- callback:
  `https://admin-kpopsoft-billing-preview-neo.vercel.app/api/auth/callback/google`
- 허용 사용자:
  Neon `admin_users`의 활성 사용자와 Auth.js Google 계정이 모두 일치
- 저장 위치:
  Vercel Preview branch-scoped `AUTH_GOOGLE_ID`,
  `AUTH_GOOGLE_SECRET`

Google Cloud 프로젝트가 둘 이상이거나 소유 계정이 불명확하면 값을
만들거나 덮어쓰지 않고 사용자 선택을 받는다. secret은 채팅, shell
history, Git, 문서에 남기지 않는다.

OAuth 연결 뒤 synthetic 고객사로 고객사 생성, 계약 초안, 계약 활성화,
청구 초안, 청구 승인을 검증한다. 무통장, Toss, widget은 계속 OFF다.

### Phase 2. 연동 기반과 Linear 읽기 미러

홈페이지에 HMAC, receipt, 작업함, cursor, 연결 테이블을 추가한다. Linear
프로젝트·이슈를 backfill하고 webhook으로 갱신한다. Hub에는 Supabase
미러와 프로젝트 연결·가져오기 UI를 추가한다.

이 단계는 `LINEAR_MIRROR_ENABLED`만 Preview에서 켠다.
`LINEAR_WRITE_ENABLED`는 OFF다.

### Phase 3. Linear 제한 명령과 프로젝트 이동

Hub에서 Linear 이슈 생성, 제목·상태·담당자·우선순위·기한 수정, 다른
프로젝트 이동을 지원한다. 프로젝트 단계 변경은 같은 프로젝트 안의
상태 변경이며, 새 프로젝트 분리는 원본·파생 관계를 보존한다.

모든 명령은 작업함, webhook 확정, 감사 로그를 통과한다.

### Phase 4. Google Shared Drive

전용 연동 계정으로 Shared Drive에 최소 권한으로 접근한다. 파일 본문은
복제하지 않고 ID, 이름, MIME type, 수정 시각, web URL, 보관 상태만 Hub에
미러한다.

Drive notification은 변경 본문을 포함하지 않으므로 cursor 기반
`changes.list`로 실제 변경을 읽는다. notification channel은 만료 전에
갱신하고 정기 reconciliation을 실행한다.

### Phase 5. CRM 문의 전환

공개 문의는 공통 pipeline과 versioned raw payload로 저장한다. 문의를
수주 처리하면 다음 단계를 멱등 실행한다.

1. Hub 프로젝트 생성 또는 기존 프로젝트 연결
2. Drive 프로젝트 폴더 생성 또는 기존 폴더 연결
3. Linear 프로젝트 생성 또는 기존 프로젝트 연결
4. 어드민 연결 상태 확정

부분 실패는 마지막 성공 단계 이후부터 재개한다. Linear에는 개인정보가
아닌 유형, 짧은 요약, 어드민 deep link만 보낸다.

### Phase 6. Billing 읽기 전용 요약

Billing과 Hub 프로젝트를 명시적으로 연결한다. 어드민은 다음 최소 요약만
Hub에 보낸다.

- 계약 상태
- 총 청구 금액
- 결제 완료 금액
- 미수금
- 최근 청구일
- 다음 납부기한
- 마지막 동기화 시각
- 어드민 deep link

고객 연락처, 계좌정보, Toss 식별키, 환불 상세, 관리자 권한은 보내지
않는다. Hub 화면에는 변경 버튼을 만들지 않는다.

### Phase 7. 보안, 관측, 단계별 운영 전환

공개 폼에 Cloudflare Turnstile과 분산 rate limit을 추가한다. HMAC key
rotation, replay 차단, reconciliation, retry queue, 감사 로그를 검증한다.

기능 플래그는 다음 순서로 Preview에서 한 개씩 활성화한다.

1. `INTEGRATIONS_ENABLED`
2. `LINEAR_MIRROR_ENABLED`
3. `LINEAR_WRITE_ENABLED`
4. `DRIVE_SYNC_ENABLED`
5. `INQUIRY_CONVERSION_ENABLED`
6. `HUB_BILLING_SUMMARY_ENABLED`

각 플래그 사이에서 두 앱의 단위·통합·브라우저 smoke와 작업함 오류 건수를
확인한다.

## 6. Billing 외부 게이트

다음 항목은 통합 기능 구현과 독립적으로 HOLD를 유지한다.

- Production Neon migration
- Production Billing flag
- 실제 무통장 계좌 노출
- Toss Test 또는 Live 활성화
- widget Production 활성화
- `pay.kpopsoft.com`, `admin.pay.kpopsoft.com` DNS cutover
- Production cron 활성화

Google OAuth Preview 연결은 Billing 관리자 흐름 검증을 위한 Preview
작업으로만 허용한다. Production OAuth와 Production 결제 활성화 승인을
의미하지 않는다.

## 7. 테스트 및 합격 기준

각 트랙은 다음을 독립적으로 통과해야 한다.

- 변경 파일의 TDD 단위 테스트
- migration contract 테스트
- TypeScript 검사
- lint
- production build
- 해당 트랙 Playwright smoke
- `git diff --check`
- 비밀값·개인정보 로그 스캔

교차 저장소 합격 기준:

- 계약 버전과 DTO가 두 저장소에서 일치한다.
- 잘못된 key, timestamp, nonce, signature가 거부된다.
- 같은 event와 command 재전송이 중복 객체를 만들지 않는다.
- 한 앱의 기능 플래그를 꺼도 기존 수신 기록과 복구 작업은 보존된다.
- Linear, Drive, Billing 장애가 Hub 기본 CRUD를 막지 않는다.
- Hub 장애가 홈페이지 문의 접수와 Billing 복구 경로를 막지 않는다.
- 모바일과 데스크톱에서 미러·명령·자료·요약 화면이 작동한다.

## 8. 배포 및 롤백

각 저장소는 독립 Preview deployment를 만든다. 교차 기능 검증 시 사용한
두 deployment ID와 두 commit SHA를 한 검증 기록에 묶는다.

롤백은 기능 플래그 OFF가 우선이다. 외부 receipt, 작업함, cursor,
idempotency 기록은 삭제하지 않는다. additive DB migration은 앱 롤백과
동시에 DROP하지 않는다.

Production 전환은 다음 조건을 모두 만족한 뒤 사용자에게 별도 승인을
받는다.

1. 두 저장소 Preview 전체 게이트 PASS
2. Billing Preview OAuth 및 synthetic 관리자 흐름 PASS
3. Linear·Drive Preview 또는 격리 테스트 객체 smoke PASS
4. DB 복구 지점과 migration 적용 순서 기록
5. 기능별 롤백 책임자와 플래그 확인
6. 비밀값 회전·동기 갱신 계획 확인

## 9. 구현 계획 분해

기존 Billing 구현 계획 세 개는 완료된 코드의 기준 문서로 유지한다.

1. `2026-07-15-billing-foundation-implementation.md`
2. `2026-07-15-billing-payments-implementation.md`
3. `2026-07-15-billing-widget-rollout-implementation.md`

후속 실행 계획은 다음 여섯 개로 나눈다.

1. 통합 마스터 실행과 Git 격리
2. 연동 기반과 Linear 읽기 미러
3. Linear 명령, 업무 이동, 프로젝트 분리
4. Google Drive 프로젝트 폴더·파일 메타데이터
5. CRM 문의 pipeline과 프로젝트 전환
6. Billing 요약, 보안 보강, 단계별 rollout

첫 계획에는 Billing Preview OAuth와 synthetic 관리자 검증을 포함한다.
나머지 계획은 첫 계획이 만든 기준선과 작업 경계를 소비한다.
