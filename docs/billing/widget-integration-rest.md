# 범용 서버·REST 결제 위젯 연동 규격

프레임워크와 관계없이 고객사 서버에 같은 origin의 토큰 엔드포인트를 만듭니다. 엔드포인트는 기존 로그인 세션 또는 서버 인증을 먼저 통과한 사용자에게만 토큰을 발급해야 합니다.

## 보안 계약

- 비밀키는 서버 환경변수(environment)에만 저장하고 브라우저·HTML·모바일 앱·Git·로그로 보내지 않습니다.
- `sub`는 이메일이나 전화번호가 아닌 1~128자의 불투명 식별자(`[A-Za-z0-9_-]`)입니다.
- `iat`은 현재 Unix 초, `exp`는 `iat + 120` 이하로 설정합니다. 최대 수명은 2분입니다.
- `jti`는 매 발급마다 암호학적으로 안전한 난수 16바이트 이상으로 새로 만듭니다.
- 응답 헤더는 반드시 `Cache-Control: no-store`입니다.

## 정확한 HMAC-SHA256 직렬화

공백 없는 UTF-8 JSON을 다음 속성 순서로 한 번만 직렬화합니다. 순서는 `iss`, `aud`, `siteId`, `sub`, `iat`, `exp`, `jti`, `kv`입니다.

```json
{"iss":"https://pay.kpopsoft.com","aud":"kpopsoft-billing-widget","siteId":"22222222-2222-4222-8222-222222222222","sub":"user_opaque_42","iat":1783846800,"exp":1783846920,"jti":"jti_1234567890abcdef","kv":1}
```

1. `payload = base64url(UTF8(canonical JSON))`을 계산합니다. Base64url은 패딩을 제거합니다.
2. 서버 환경변수의 32바이트 base64url 비밀키를 디코딩합니다.
3. `signature = base64url(HMAC-SHA256(secret, ASCII(payload)))`을 계산합니다.
4. 최종 토큰은 `payload + "." + signature`입니다.
5. `200 application/json`으로 `{ "token": "..." }`를 반환합니다.

## 고정 테스트 벡터

다음 값은 구현 검증 전용이며 운영 비밀키로 사용하면 안 됩니다.

```text
secret(base64url): FxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxcXFxc
canonical JSON: {"iss":"https://pay.kpopsoft.com","aud":"kpopsoft-billing-widget","siteId":"22222222-2222-4222-8222-222222222222","sub":"user_opaque_42","iat":1783846800,"exp":1783846920,"jti":"jti_1234567890abcdef","kv":1}
token: eyJpc3MiOiJodHRwczovL3BheS5rcG9wc29mdC5jb20iLCJhdWQiOiJrcG9wc29mdC1iaWxsaW5nLXdpZGdldCIsInNpdGVJZCI6IjIyMjIyMjIyLTIyMjItNDIyMi04MjIyLTIyMjIyMjIyMjIyMiIsInN1YiI6InVzZXJfb3BhcXVlXzQyIiwiaWF0IjoxNzgzODQ2ODAwLCJleHAiOjE3ODM4NDY5MjAsImp0aSI6Imp0aV8xMjM0NTY3ODkwYWJjZGVmIiwia3YiOjF9.QqBARQ7yD46aNnwqf_qBiD4Zc53QuFuvKc_8Sp55mwk
```

## 위젯 삽입

위젯 버전은 `v1`에 고정하고 토큰 엔드포인트는 고객사 페이지와 같은 origin으로 둡니다.

```html
<script src="https://pay.kpopsoft.com/widgets/kpopsoft-billing.v1.js" defer></script>
<kpopsoft-billing
  public-id="wgt_replace_me"
  token-endpoint="/api/kpopsoft/billing-token"
></kpopsoft-billing>
```

고객사 브라우저는 공개 ID와 단기 토큰만 취급합니다. 비밀키뿐 아니라 금액과 결제 상태도 브라우저 입력을 신뢰하지 않으며, KPOPSOFT Billing Hub가 서버 DB에서 확정합니다.
