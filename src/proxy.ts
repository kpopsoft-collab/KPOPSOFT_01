import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

/**
 * Next.js 16 proxy (formerly `middleware.ts`). 두 가지 책임을 순서대로 처리한다.
 *
 * 1. **nonce 기반 CSP** — 전체 경로에 붙는다(단 `/course-assets`와 정적 자산은
 *    제외 — 아래 `config.matcher` 주석 참고).
 * 2. **Supabase 세션 갱신 + 미인증 리다이렉트** — `/admin/*`에서만 돈다.
 *    전체 경로에서 매 요청 세션을 갱신하면 공개 페이지에 불필요한 Supabase
 *    왕복이 붙는다(결정기록 07-content-security-policy §2).
 *
 * Do not insert logic between `createServerClient` and `getUser()`.
 */

// ── CSP ──────────────────────────────────────────────────────────────────
//
// **강제다**(2026-08-06 전환). 2026-08-05~06 Report-Only 관찰에서 위반 0건을
// 확인하고 바꿨다. 되돌리려면 이 상수만 "-Report-Only"를 붙이면 된다.
//
// 전환의 전제 조건이 하나 있었다 — **모든 페이지가 동적 렌더링이어야 한다.**
// 아래 `'strict-dynamic'` 때문에 `'self'`가 무시되므로, 빌드 때 미리 만든
// HTML(= nonce 없음)은 스크립트가 통째로 막힌다. 그래서 루트 레이아웃에
// `export const dynamic = "force-dynamic"`를 걸어 두었다.
// **그 줄을 지우면 여기가 같이 깨진다**(src/app/layout.tsx).
const CSP_HEADER_NAME = "Content-Security-Policy";

/**
 * nonce를 요청 헤더로도 실어 보낸다(Next.js 공식 예제와 같은 이름).
 *
 * ⚠️ **Next가 스크립트에 nonce를 붙이는 근거는 이 헤더가 아니다.** Next는
 * 우리가 응답에 건 `Content-Security-Policy(-Report-Only)` 헤더를 직접 파싱해
 * nonce를 꺼낸다(`next/dist/server/app-render/app-render.js`). 미들웨어 응답
 * 헤더가 요청 헤더로 복사돼 렌더러까지 전달되는 경로다.
 *
 * 그러니 **CSP 헤더를 응답에서 빼면 nonce가 통째로 사라진다.** 이 `x-nonce`를
 * 남겨 두는 이유는 서버 컴포넌트가 `headers()`로 직접 읽어 쓸 수 있게 하는
 * 관례를 따르기 위해서다 — 지금 이 값을 읽는 코드는 없다(2026-08-05 기준).
 */
const NONCE_HEADER_NAME = "x-nonce";

// 위반 보고 수신 라우트. 이 파일에서는 경로 문자열만 참조한다 — 라우트 자체는
// 별도 작업으로 만든다.
const CSP_REPORT_URI = "/api/csp-report";

// Pretendard CSS(style-src)와 그 CSS가 참조하는 woff2(font-src)의 출처.
const STYLE_FONT_CDN = "https://cdn.jsdelivr.net";

const ADMIN_PATH_PREFIX = "/admin";

/**
 * `NEXT_PUBLIC_SUPABASE_URL`에서 origin만 뽑는다. 도메인을 하드코딩하면
 * 프로젝트를 옮겼을 때 여기만 안 고쳐져 조용히 깨진다.
 *
 * **던지지 않는다.** 이 함수는 이제 `/admin`뿐 아니라 **모든 요청**에서
 * 불린다 — env가 비거나 모양이 깨졌을 때 throw하면 proxy가 죽어서
 * **사이트 전체가 500**이 된다. 공개 페이지는 Supabase가 죽어도 정적
 * 폴백으로 버티도록 만들어 뒀는데(`public-content.ts`), CSP 때문에 그
 * 설계가 무너지면 안 된다. 값이 없으면 해당 출처만 빼고 정책을 만든다 —
 * Report-Only 단계에서는 위반 보고가 늘 뿐이고, 강제 단계에서도 화면이
 * 안 뜨는 것보다 이미지가 안 뜨는 편이 낫다.
 */
function supabaseOrigin(): string | null {
  const raw = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!raw) return null;
  try {
    return new URL(raw).origin;
  } catch {
    return null;
  }
}

function createNonce(): string {
  return Buffer.from(crypto.randomUUID()).toString("base64");
}

/** 정책초안 §1 그대로. dev에서만 `'unsafe-eval'`(디버깅 API)과 `ws:`(HMR
 * 웹소켓)를 더한다 — prod에는 절대 넣지 않는다(조사결과 §5). */
function buildCsp(nonce: string): string {
  const isDev = process.env.NODE_ENV === "development";
  const supabase = supabaseOrigin();

  const scriptSrc = ["'self'", `'nonce-${nonce}'`, "'strict-dynamic'"];
  if (isDev) scriptSrc.push("'unsafe-eval'");

  // supabase가 null이면(=env 없음) 그 출처만 빠진다. 위 supabaseOrigin() 주석 참고.
  const imgSrc = ["'self'", supabase].filter(Boolean);
  const connectSrc = ["'self'", supabase].filter(Boolean);
  // https dev나 프록시 뒤에서는 HMR이 wss로 붙는다(정책초안 §1 "개발 모드 추가분").
  if (isDev) connectSrc.push("ws:", "wss:");

  const directives = [
    `default-src 'self'`,
    `base-uri 'self'`,
    `object-src 'none'`,
    `frame-ancestors 'none'`,
    `form-action 'self'`,
    `script-src ${scriptSrc.join(" ")}`,
    `style-src 'self' 'unsafe-inline' ${STYLE_FONT_CDN}`,
    `font-src 'self' ${STYLE_FONT_CDN}`,
    `img-src ${imgSrc.join(" ")}`,
    `connect-src ${connectSrc.join(" ")}`,
    `report-uri ${CSP_REPORT_URI}`,
    `upgrade-insecure-requests`,
  ];

  return directives.join("; ") + ";";
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const nonce = createNonce();
  const csp = buildCsp(nonce);

  // nonce를 요청 헤더에 함께 싣는다(용도는 NONCE_HEADER_NAME 주석 참고).
  const requestHeaders = new Headers(request.headers);
  requestHeaders.set(NONCE_HEADER_NAME, nonce);

  let response = NextResponse.next({ request: { headers: requestHeaders } });

  if (pathname.startsWith(ADMIN_PATH_PREFIX)) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value }) =>
              request.cookies.set(name, value),
            );
            // 여기서 response를 다시 만들 때 `request`를 통째로 넘기면 위에서
            // 붙인 x-nonce 헤더가 빠진다. 갱신된 Cookie만 사본으로 옮겨 와
            // 같은 requestHeaders를 계속 쓴다.
            requestHeaders.set("cookie", request.headers.get("cookie") ?? "");
            response = NextResponse.next({
              request: { headers: requestHeaders },
            });
            cookiesToSet.forEach(({ name, value, options }) =>
              response.cookies.set(name, value, options),
            );
          },
        },
      },
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    const isLogin = pathname.startsWith("/admin/login");

    // Mirror the auth seam's DEV bypass: while it's on, don't gate /admin so the
    // shell stays reachable before login/first-admin exist (src/lib/admin/auth.ts).
    const devBypass = process.env.ADMIN_DEV_BYPASS !== "false";

    if (!devBypass && !user && !isLogin) {
      const url = request.nextUrl.clone();
      url.pathname = "/admin/login";
      response = NextResponse.redirect(url);
    }
  }

  response.headers.set(CSP_HEADER_NAME, csp);
  return response;
}

export const config = {
  // 전체 경로에 CSP를 걸되 아래는 제외한다.
  //
  // - `course-assets` : 업로드된 강의 자료가 자체 `Content-Security-Policy:
  //   sandbox`를 응답에 싣는다(src/app/course-assets/[...path]/route.ts).
  //   여기서 전역 nonce CSP까지 겹으로 걸리면 브라우저가 두 정책을
  //   **교집합**으로 적용해서, nonce가 없는 업로드 자료 속 스크립트가 전부
  //   막혀 자료가 안 뜬다(결정기록 07-content-security-policy §6).
  // - `_next/static`, `_next/image` : 빌드 산출물·이미지 최적화 응답이다.
  //   HTML이 아니라 CSP를 걸 이유가 없고, 정적 자산마다 proxy를 태우면
  //   캐시 효율만 떨어진다.
  // - `favicon.ico` · `icon.png/svg` · `manifest.webmanifest` · `opengraph-image`
  //   : Next가 만드는 정적 메타데이터 응답이다. HTML이 아니라 CSP가 의미 없다.
  // - `api` : JSON을 주고받는 라우트라 CSP가 필요 없다. `/api/csp-report`도
  //   여기 포함된다 — 위반 보고 요청 자체에 CSP를 걸 이유가 없다.
  //
  // `/admin/:path*`는 일부러 제외하지 않는다 — CSP와 세션 갱신이 모두
  // 필요한 경로다.
  //
  // 각 항목 뒤의 `/`와 `favicon\.ico$`는 **경계**다. 없으면 접두사만 같아도
  // 제외돼서 `/apitest`·`/course-assets-x` 같은 정상 경로가 조용히 CSP를
  // 못 받는다(2026-08-05 교차검증에서 실제로 확인).
  //
  // 확장자 앞 백슬래시가 두 개인 이유 — 이건 JS **문자열 리터럴**이다.
  // 한 개로 쓰면 유효하지 않은 이스케이프라 그냥 `.`(임의 문자)로 풀려서
  // `/faviconXico` 같은 경로까지 제외된다. 정규식에 마침표 리터럴을
  // 넘기려면 문자열에 두 개로 적어야 한다.
  matcher: [
    "/((?!course-assets/|_next/static/|_next/image/|favicon\\.ico$|api/|icon\\.(?:png|svg)$|manifest\\.webmanifest$|opengraph-image).*)",
  ],
};
