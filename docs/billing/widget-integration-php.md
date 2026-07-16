# PHP 고객사 결제 위젯 연동

고객사 PHP 서버가 기존 로그인 세션을 먼저 확인한 뒤 HMAC-SHA256 토큰을 발급합니다. 토큰 수명은 최대 2분(120초)이며 비밀키는 서버 environment에만 보관합니다.

## 1. 서버 환경변수

```dotenv
KPOPSOFT_WIDGET_ISSUER=https://pay.kpopsoft.com
KPOPSOFT_WIDGET_PUBLIC_ID=wgt_replace_me
KPOPSOFT_WIDGET_SITE_ID=00000000-0000-4000-8000-000000000000
KPOPSOFT_WIDGET_KEY_VERSION=1
KPOPSOFT_WIDGET_SECRET=replace_with_base64url_secret
```

비밀키를 브라우저 JavaScript, HTML, 로그 또는 저장소에 포함하지 마세요. 공개 ID만 브라우저에서 사용합니다.

## 2. 토큰 엔드포인트

다음 파일을 예를 들어 `/api/kpopsoft-billing-token.php`에 둡니다. `$_SESSION['user_id']`는 고객사 기존 인증 체계의 불투명 사용자 식별자로 교체합니다.

```php
<?php
declare(strict_types=1);
session_start();

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

// 반드시 고객사 로그인 세션을 먼저 인증합니다.
if (!isset($_SESSION['user_id'])) {
    http_response_code(401);
    echo json_encode(['error' => 'AUTHENTICATION_REQUIRED']);
    exit;
}

$required = static function (string $name): string {
    $value = trim((string) getenv($name));
    if ($value === '') {
        throw new RuntimeException("Missing environment variable: {$name}");
    }
    return $value;
};

$base64url = static fn (string $bytes): string =>
    rtrim(strtr(base64_encode($bytes), '+/', '-_'), '=');
$decodeBase64url = static function (string $value): string {
    $padding = (4 - strlen($value) % 4) % 4;
    $decoded = base64_decode(strtr($value . str_repeat('=', $padding), '-_', '+/'), true);
    if ($decoded === false) throw new RuntimeException('Invalid widget secret');
    return $decoded;
};

$iat = time();
$subject = (string) $_SESSION['user_id'];
if (!preg_match('/^[A-Za-z0-9_-]{1,128}$/', $subject)) {
    throw new RuntimeException('Widget subject must be an opaque identifier');
}

// PHP 배열 삽입 순서가 서명 규격입니다. 순서를 변경하지 않습니다.
$claims = [
    'iss' => $required('KPOPSOFT_WIDGET_ISSUER'),
    'aud' => 'kpopsoft-billing-widget',
    'siteId' => $required('KPOPSOFT_WIDGET_SITE_ID'),
    'sub' => $subject,
    'iat' => $iat,
    'exp' => $iat + 120,
    'jti' => bin2hex(random_bytes(16)),
    'kv' => (int) $required('KPOPSOFT_WIDGET_KEY_VERSION'),
];

$json = json_encode($claims, JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
$payload = $base64url($json);
$secret = $decodeBase64url($required('KPOPSOFT_WIDGET_SECRET'));
if (strlen($secret) !== 32) throw new RuntimeException('Invalid widget secret');
$signature = hash_hmac('sha256', $payload, $secret, true);
$token = $payload . '.' . $base64url($signature);

echo json_encode(['token' => $token], JSON_UNESCAPED_SLASHES | JSON_THROW_ON_ERROR);
```

서명 대상은 JSON 원문이 아니라 `base64url(JSON)` 문자열입니다. Base64url은 패딩 `=`를 제거하고, HMAC 결과는 위 코드처럼 raw binary(`true`)로 받은 뒤 인코딩합니다.

## 3. 페이지에 위젯 삽입

```html
<script src="https://pay.kpopsoft.com/widgets/kpopsoft-billing.v1.js" defer></script>
<kpopsoft-billing
  public-id="wgt_replace_me"
  token-endpoint="/api/kpopsoft-billing-token.php"
></kpopsoft-billing>
```

토큰 응답은 항상 `Cache-Control: no-store`로 반환합니다. `token-endpoint`는 위젯을 넣은 페이지와 같은 origin이어야 하며, 금액·결제 상태·비밀키를 브라우저에서 생성하거나 전달하지 않습니다.
