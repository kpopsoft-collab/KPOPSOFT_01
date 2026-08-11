# 09 — 문의 알림 메일이 도착하지 않는다

**OpenProject** — [WP 258 "메일 발송불가함"](https://op.kpopsoft.com/work_packages/258)
(담당 안영근, 2026-08-10 등록) · 기준 작업
[KPO-23 "이메일 발송시스템 개발"](https://op.kpopsoft.com/work_packages/182)
(담당 오세승, 할일)

**증상** — 홈 Contact(및 `/education` 문의 폼)에서 문의를 넣으면 화면은
"정상적으로 접수되었습니다"가 뜨는데, 관리자에게 **메일이 오지 않는다.**

**결론부터** — 문의는 **정상 저장되고 있다.** 유실된 문의는 없다.
메일만 안 나간다. 원인은 버그가 아니라 **연동 미완료**다.
`RESEND_API_KEY`가 비어 있어 `notifyNewInquiry()`가 발송을 건너뛰고
콘솔 로그만 남긴다(`src/lib/email.ts:62-72`).

**그런데 고치는 방향이 바뀌었다.** KPO-23의 승인된 설계는 Resend가 아니라
**Cloudflare Email Service**를 쓴다. 그리고 `kpopsoft.com` DNS가 이미 그쪽으로
잡혀 있다 — NS·MX·SPF 전부 Cloudflare다([02](02-현황분석.md) §5).
main의 Resend 코드는 **승인된 설계와 다른 물건**이다.

## 읽는 순서

| | 문서 | 내용 |
|---|---|---|
| 1 | [01-요구사항.md](01-요구사항.md) | 무엇이 되어야 끝인가 · KPO-23이 정한 범위 |
| 2 | [02-현황분석.md](02-현황분석.md) | 실측값 — DB·env·DNS·재사용 가능한 코드 |
| 3 | [03-원인과-결정.md](03-원인과-결정.md) | 원인 3단, 결정 D1~D6, 미결 질문 |
| 4 | [04-구현계획.md](04-구현계획.md) | 단계 순서와 그 순서인 이유 |
| 5 | [05-검증체크리스트.md](05-검증체크리스트.md) | 무엇을 봐야 "된다"고 말할 수 있나 |
| 6 | [06-구현결과.md](06-구현결과.md) | **계획과 다른 점 · 아직 안 한 것** |

## 결정 요약

- **D1** — 문의 저장 경로는 **손대지 않는다.** 정상 동작을 실측으로 확인했다.
- **D2** — 발송은 **Cloudflare Email Service**로 간다. Resend가 아니다.
  KPO-23 승인 설계 §7이고, DNS가 이미 Cloudflare다.
- **D3** — 수신자는 **검증된 `kpopsoft@gmail.com` 하나**로 고정한다.
  이건 취향이 아니라 **비용 결정**이다 — 검증된 주소는 전 플랜 무료,
  임의 수신자는 Workers 유료 플랜이 필요하다.
- **D4** — `codex/…-wind` 브랜치의 이메일 모듈 **2개만 이식**한다.
  그 브랜치의 스택(Neon·Auth.js·Vercel Blob)은 가져오지 않는다.
- **D5** — 발송 실패를 **조용히 삼키지 않는다.** 이번 건이 두 달 넘게
  안 보인 이유가 이것이다.
- **D6** — 수신(`inquiry@kpopsoft.com` → Gmail 전달)도 이 작업에 포함한다.
  KPO-23의 범위이고 MX·SPF가 이미 깔려 있다.
- **D7** — 이식할 응답 매퍼를 **그대로 쓰지 않는다.** 실제 API 응답이
  그 매퍼에서 `provider_error`로 떨어진다.

근거와 버린 대안은 [03-원인과-결정.md](03-원인과-결정.md).

## 미결 현황 (2026-08-11 갱신)

**풀린 것** — Cloudflare 토큰 수령·active 확인 / `kpopsoft@gmail.com`
**2026-07-12 검증 완료** / KPO-28의 Resend 표기는 낡음(사용자 확답).

**✅ 끝났다 — 운영에서 문의 알림 수신을 확인했다**(2026-08-11).
WP 258이 신고한 증상은 해소됐다. 결과와 계획 대비 차이는
[06-구현결과.md](06-구현결과.md).

**남은 것**

1. `/education` 문의 폼 실측 — 그 폼으로 직접 눌러 본 기록이 없다
2. `inquiry@kpopsoft.com` 라우팅 규칙(D6) — 대시보드에서 눈으로
3. 매퍼 테스트를 실제 응답 픽스처로 재작성
4. `cloudflare` SDK 대신 `fetch`를 쓴 것을 받아들일지 ([06](06-구현결과.md) §1)
5. `resend` 의존성 제거 · **토큰 재발급**

## 닿는 파일

| 파일 | 무엇 |
|---|---|
| `src/lib/email.ts` | **교체 대상.** Resend → Cloudflare |
| `src/lib/inquiry-actions.ts` | 저장 후 알림 호출(`:132-137`). 호출부는 유지 |
| `package.json` | `cloudflare` 추가 / `resend` 제거 |
| `.env.example` | `RESEND_*` 3개 → `CLOUDFLARE_*`·`INQUIRY_NOTIFICATION_*` 4개 |
| `docs/07-dev/02-개발상태.md` | `:99-100` Resend 언급 갱신 |
| `docs/06-admin/00-START-HERE.md` | `:38`, `03-…:61` 같은 취지. 같이 갱신 |
| Vercel 프로젝트 env · Cloudflare 대시보드 | 코드 밖. 여기가 실제 스위치다 |

**건드리지 않는다** — `src/components/sections/final-cta.tsx`,
`src/components/sections/education/inquiry-form.tsx`.
두 폼 모두 `submitInquiry`를 타고, 그 경로는 정상이다.

## 읽지 못한 자료

KPO-23 첨부 **`email-sending.md`는 열 수 없다.** Linear 임베드로만 들어 있고
서명 URL이 만료됐다(OpenProject 첨부로 이관되지 않음, `total: 0`).
다만 승인 설계 `2026-07-13-vercel-admin-platform-design.md` §7이
"KPO-23과 첨부 `email-sending.md`를 이메일 구현 기준으로 사용한다"고 밝히고
그 내용을 다시 적어 뒀다. **그 §7을 이 작업의 기준으로 삼는다.**
원본이 필요하면 Linear에서 다시 받아야 한다.

---

- 결정 기록 시작점 — [`../00-START-HERE.md`](../00-START-HERE.md)
- 어드민 기준 문서 — [`../../06-admin/00-START-HERE.md`](../../06-admin/00-START-HERE.md)
- **지금 어떻게 동작하나** — [`../../06-admin/09-문의-알림-메일.md`](../../06-admin/09-문의-알림-메일.md)
