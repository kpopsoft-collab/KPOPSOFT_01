# Next.js 고객사 결제 위젯 연동

고객사 서버가 기존 로그인 세션을 먼저 인증한 뒤 2분(120초)짜리 토큰을 발급하고, 브라우저의 위젯은 그 토큰으로 KPOPSOFT Billing Hub를 호출합니다. 결제 금액이나 결제 상태는 고객사 브라우저가 보내지 않으며 Billing Hub DB의 청구서가 기준입니다.

## 1. 서버 환경변수

다음 값은 고객사 배포 환경의 **서버 전용 environment 변수**로 등록합니다. `KPOPSOFT_WIDGET_SECRET`은 절대로 `NEXT_PUBLIC_` 접두사를 붙이지 않습니다.

```dotenv
KPOPSOFT_WIDGET_ISSUER=https://pay.kpopsoft.com
KPOPSOFT_WIDGET_PUBLIC_ID=wgt_replace_me
KPOPSOFT_WIDGET_SITE_ID=00000000-0000-4000-8000-000000000000
KPOPSOFT_WIDGET_KEY_VERSION=1
KPOPSOFT_WIDGET_SECRET=replace_with_base64url_secret
```

비밀키를 브라우저 코드, HTML, 로그, 분석 도구 또는 Git에 넣지 마세요. 공개 ID만 브라우저에 전달할 수 있습니다.

## 2. 토큰 Route Handler

아래 예시의 `auth()` import는 고객사 사이트의 실제 인증 모듈로 바꿉니다. 이메일 대신 외부에 노출해도 되는 불투명 내부 사용자 ID를 `sub`로 사용해야 합니다.

```ts
// app/api/kpopsoft/billing-token/route.ts
import { createHmac, randomBytes } from "node:crypto";
import { NextResponse } from "next/server";

import { auth } from "@/auth"; // 고객사 기존 로그인 세션 인증

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

function required(name: string): string {
  const value = process.env[name]?.trim();
  if (!value) throw new Error(`Missing ${name}`);
  return value;
}

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json(
      { error: "AUTHENTICATION_REQUIRED" },
      { status: 401, headers: { "Cache-Control": "no-store" } },
    );
  }

  const iat = Math.floor(Date.now() / 1000);
  const claims = {
    // 이 순서를 변경하지 않습니다.
    iss: required("KPOPSOFT_WIDGET_ISSUER"),
    aud: "kpopsoft-billing-widget",
    siteId: required("KPOPSOFT_WIDGET_SITE_ID"),
    sub: String(session.user.id),
    iat,
    exp: iat + 120,
    jti: randomBytes(18).toString("base64url"),
    kv: Number(required("KPOPSOFT_WIDGET_KEY_VERSION")),
  };
  if (!/^[A-Za-z0-9_-]{1,128}$/.test(claims.sub)) {
    throw new Error("Widget subject must be an opaque identifier");
  }

  const payload = Buffer.from(JSON.stringify(claims), "utf8").toString(
    "base64url",
  );
  const secret = Buffer.from(required("KPOPSOFT_WIDGET_SECRET"), "base64url");
  if (secret.byteLength !== 32) throw new Error("Invalid widget secret");
  const signature = createHmac("sha256", secret)
    .update(payload, "utf8")
    .digest("base64url");

  return NextResponse.json(
    { token: `${payload}.${signature}` },
    { headers: { "Cache-Control": "no-store" } },
  );
}
```

서명 규칙은 `base64url(canonical JSON).base64url(HMAC-SHA256(payload, secret))`입니다. JSON 속성 순서는 `iss, aud, siteId, sub, iat, exp, jti, kv`로 고정합니다.

## 3. 페이지에 위젯 삽입

스크립트 버전은 반드시 `v1`에 고정하고 `token-endpoint`는 같은 origin의 경로를 사용합니다.

```html
<script src="https://pay.kpopsoft.com/widgets/kpopsoft-billing.v1.js" defer></script>
<kpopsoft-billing
  public-id="wgt_replace_me"
  token-endpoint="/api/kpopsoft/billing-token"
></kpopsoft-billing>
```

응답과 페이지에 `Cache-Control: no-store` 정책을 적용하고, CSP를 사용하는 사이트는 `script-src https://pay.kpopsoft.com` 및 `connect-src https://pay.kpopsoft.com`을 허용합니다. 위젯에는 비밀키·금액·결제 상태를 속성으로 넘기지 않습니다.
