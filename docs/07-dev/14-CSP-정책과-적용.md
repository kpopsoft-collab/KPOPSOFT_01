# CSP 정책과 적용 상태

> **위치** `docs/07-dev/14-CSP-정책과-적용.md` · **상시 유효 문서다.**
> **읽는 순서** ← [00-START-HERE](00-START-HERE.md)
>
> **지금 어떻게 동작하는가**의 기준이다. "왜 그렇게 정했나"의 조사·결정 기록은
> [../08-decisions/07-content-security-policy/](../08-decisions/07-content-security-policy/00-START-HERE.md).

---

## 1. 현재 상태 — **강제** (2026-08-06 전환)

```
src/proxy.ts   →  Content-Security-Policy
```

**위반은 실제로 차단된다.** Report-Only(2026-08-05)로 하루 관찰해 위반 0건을
확인하고 바꿨다.

> ⚠️ **전제 조건이 하나 붙어 있다 — `src/app/layout.tsx`의
> `export const dynamic = "force-dynamic"`.** 그 줄이 없으면 정적으로 만들어진
> 페이지에 nonce가 안 박혀 **그 페이지의 스크립트가 전부 막힌다.** §5를 읽지 않고
> 지우면 안 된다.

되돌리려면 `CSP_HEADER_NAME`에 `-Report-Only`를 도로 붙인다. 한 줄이다
(`force-dynamic`은 그때도 남겨 둔다).

`docs/03-education/13`의 release gate **G6이 이 문서로 대체된다.**

## 2. 정책

```
default-src 'self'; base-uri 'self'; object-src 'none';
frame-ancestors 'none'; form-action 'self';
script-src 'self' 'nonce-{요청마다 새로} ' 'strict-dynamic';
style-src  'self' 'unsafe-inline' https://cdn.jsdelivr.net;
font-src   'self' https://cdn.jsdelivr.net;
img-src    'self' <NEXT_PUBLIC_SUPABASE_URL의 origin>;
connect-src 'self' <같은 origin>;
report-uri /api/csp-report;
upgrade-insecure-requests;
```

dev에서만 `script-src`에 `'unsafe-eval'`, `connect-src`에 `ws: wss:`가 더해진다
(HMR·디버깅 API). **prod에는 들어가지 않는다.**

Supabase 도메인은 하드코딩하지 않고 `NEXT_PUBLIC_SUPABASE_URL`에서 뽑는다.
env가 없거나 깨져도 **throw하지 않고 그 출처만 빼고** 정책을 만든다 — 여기서
던지면 proxy가 죽어 **사이트 전체가 500**이 된다.

### `style-src 'unsafe-inline'`을 남긴 이유

빼려면 두 가지를 해야 하는데 둘 다 지금은 불가능하다.

| 막는 것 | 왜 못 빼나 |
|---|---|
| `style={{...}}` **11곳 / 7파일** | 대부분 런타임 값(스크롤 offset, 캐러셀 translateX, 실측 px)이라 정적 클래스로 못 옮긴다 |
| `next/image`의 `fill`이 박는 `style="position:absolute;…"` | **프레임워크가 주입한다.** 우리 코드로 못 없앤다 |

**CSP nonce는 `<style>` 요소에만 붙고 `style="…"` 속성에는 적용되지 않는다.**

> 이건 실패가 아니다. CSP의 XSS 방어력은 대부분 `script-src`에서 나온다.
> 공격자가 `style` 속성만 넣을 수 있고 스크립트를 못 넣으면 할 수 있는 일이
> 극히 제한된다.

## 3. 어디에 거나 — `proxy.ts` 하나

`next.config.ts`의 `headers()`는 **쓰지 않는다.** nonce는 요청마다 달라야 하는데
그 설정은 정적이다.

`proxy.ts`는 두 책임을 갖는다.

| | 범위 |
|---|---|
| nonce + CSP | 전체 경로 (§4 제외분 빼고) |
| Supabase 세션 갱신·미인증 리다이렉트 | **`/admin/*`에서만** |

전체 경로에서 매 요청 세션을 갱신하면 공개 페이지에 불필요한 Supabase 왕복이
붙는다. 그래서 나눴다.

### nonce는 어디서 오나 — **`x-nonce`가 아니다**

Next는 우리가 **응답에 건 CSP 헤더를 직접 파싱해** nonce를 꺼낸다
(`next/dist/server/app-render/app-render.js`). 미들웨어 응답 헤더가 요청 헤더로
복사돼 렌더러까지 전달되는 경로다.

> **CSP 헤더를 응답에서 빼면 nonce가 통째로 사라진다.** `x-nonce` 요청 헤더는
> 서버 컴포넌트가 `headers()`로 읽어 쓰라는 관례일 뿐이고, 지금 읽는 코드는 없다.

## 4. 제외 경로 — **바꾸기 전에 반드시 읽을 것**

```
course-assets/  _next/static/  _next/image/  api/
favicon.ico  icon.png  icon.svg  manifest.webmanifest  opengraph-image
```

### `/course-assets/`가 가장 중요하다

그 라우트는 업로드된 강의 자료를 **자체 `CSP: sandbox`** 로 격리해 내보낸다.
전역 nonce CSP까지 겹으로 걸리면 브라우저가 두 정책을 **교집합**으로 적용해서,
nonce가 없는 자료 속 스크립트가 전부 막혀 **자료가 통째로 안 뜬다.**

### 경계(`/`, `$`)를 지운다면 그 이유를 남길 것

각 항목 뒤의 `/`와 확장자 앞 `$`는 접두사 오탐을 막는 **경계**다. 없으면
`/apitest`·`/course-assets-x` 같은 정상 경로가 조용히 CSP를 못 받는다.

문자열 안의 백슬래시가 두 개인 것도 의도다 — JS 문자열 리터럴이라 한 개로 쓰면
`.`이 임의 문자로 풀려 `/faviconXico`까지 제외된다.

## 5. ⚠️ 전 페이지가 동적 렌더링이어야 한다 — **강제 CSP의 전제 조건**

```ts
// src/app/layout.tsx
export const dynamic = "force-dynamic";
```

**이 한 줄이 §1의 강제 CSP를 떠받친다. 지우면 사이트가 조용히 깨진다.**

`'strict-dynamic'`이 켜지면 `'self'`는 **무시되고** nonce 있는 스크립트만 돈다.
nonce는 요청마다 만들어지므로 **빌드 때 미리 만든 HTML에는 없다.** 그래서
정적으로 프리렌더된 페이지는 스크립트가 통째로 막힌다.

전환 전 실측(2026-08-05)이 그 상태였다.

| 라우트 | script | nonce | |
|---|---|---|---|
| `/education/programs` (동적) | 25 | 25 | ✅ |
| **`/admin/login`** (정적) | 13 | **0** | ❌ 로그인 불가 |
| `/education/cases` (정적) | 19 | **0** | ❌ |
| `/_not-found` (정적) | 10 | **0** | ❌ |

루트 레이아웃에 `force-dynamic`을 건 뒤 전 라우트가 `script 수 == nonce 수`가
됐다(`/admin/login` 11/11, `/education/cases` 19/19, `/_not-found` 10/10).

### 왜 페이지 3개가 아니라 루트인가

**나중에 추가되는 정적 페이지가 조용히 막히기 때문이다.** 빌드 로그의 `○`
표시를 눈으로 보지 않으면 알아챌 방법이 없고, 증상은 "그 페이지만 인터랙션이
안 된다"라 CSP까지 거슬러 올라가기 어렵다.

잃는 것은 사실상 없다 — 정적이던 HTML 라우트는 위 셋뿐이고 나머지 40여 개는
Supabase를 읽어서 이미 동적이었다. `icon.png`·`manifest.webmanifest` 등
메타데이터 파일 4개는 지금도 정적이다(HTML이 아니라 무관).

> 전환 근거와 버린 대안은
> [../08-decisions/07-content-security-policy/04-강제전환.md](../08-decisions/07-content-security-policy/04-강제전환.md).

## 5-1. 전환 전 확인 체크리스트 — **2026-08-06 통과**

아래 8개는 사람이 화면에서 확인했다.

| # | 확인 | |
|---|---|---|
| 1 | 홈 · `/education` · `/education/programs` · 상세 4개 정상 | ✅ |
| 2 | **`상세 자료 보기` → 새 탭에서 슬라이드가 실제로 넘어간다** | ✅ |
| 3 | 어드민 로그인 → 정규 클래스 저장 | ✅ |
| 4 | 어드민 이미지 업로드 · zip 업로드 | ✅ |
| 5 | 문의 폼 전송 | ✅ |
| 6 | 후기 마키가 계속 돈다 (`--marquee-shift` 인라인 스타일) | ✅ |
| 7 | 콘솔 CSP 위반 **0건** | ✅ |
| 8 | 모바일(375)에서 1~6 반복 | ✅ |

> **3·4는 `06-admin/07` §3-3의 회귀 테스트와 다른 것을 본다** — *저장이
> 되는가*이지 *저장했을 때 기존 자료가 지워지지 않는가*가 아니다. 그쪽도
> 같은 날 따로 통과했다 — [05-남은결정과-작업.md](05-남은결정과-작업.md).

### 기계 검증 — 2026-08-06

사람 확인과 별개로, 배포본 응답 헤더와 프로덕션 빌드를 직접 쟀다. 11개 라우트
전부 `script 수 == nonce 수`, 브라우저에서 CSP 위반·예외 **0건**, 하이드레이션과
상호작용 정상, 업로드 자료 격리 유지(`self.origin === "null"`, 이미지 6/6).

**무엇을 어떻게 쟀는지는**
[../08-decisions/07-content-security-policy/04-강제전환.md](../08-decisions/07-content-security-policy/04-강제전환.md) §5에 있다.

## 6. 위반 보고

`src/app/api/csp-report/route.ts` — POST만 받고 **저장하지 않는다.** 서버 로그로만
남긴다(DB에 넣으면 그 자체가 관리 대상이 된다).

- 본문 상한 16KB. `Content-Length` 선제 검사 + 스트림 누적 검사 2단
  (헤더가 없거나 거짓인 청크 전송까지 막는다)
- JSON 파싱 실패는 400이 아니라 **조용히 204** — 봇이 보내는 쓰레기로 4xx 로그가
  도배되면 진짜 위반 신호가 묻힌다
- 구형(`csp-report` 객체)·신형(Reporting API 배열) 두 형식을 같은 로그 모양으로 정규화

---

← [00-START-HERE](00-START-HERE.md)
