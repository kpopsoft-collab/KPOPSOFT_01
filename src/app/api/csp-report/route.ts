/**
 * CSP 위반 보고 수신 엔드포인트.
 *
 * Next.js는 CSP `report-uri`/`report-to`가 보낸 위반 보고를 받아 주는 내장
 * 기능을 제공하지 않는다(백로그 07 `01-조사결과.md` §4) — 직접 만들어야 한다.
 *
 * Report-Only 단계에서 `proxy.ts`가 이 경로를 `report-uri`로 지정하면, 정책을
 * 위반한 브라우저가 이 엔드포인트로 JSON을 POST한다. 여기서는 **저장하지
 * 않고** 서버 로그로만 남긴다 — DB에 넣으면 그 자체가 관리 대상이 된다
 * (`02-정책초안.md` §3). 인증도 걸지 않는다 — 브라우저가 자격증명 없이 보낸다.
 *
 * GET 등 다른 메서드 핸들러는 두지 않는다. Next가 구현되지 않은 메서드에
 * 자동으로 405를 돌려준다(`Allow` 헤더까지 붙지는 않는 것을 실측으로 확인했다
 * — 브라우저가 리포트를 POST로만 보내므로 문제되지 않는다).
 */

// POST 전용 라우트라 애초에 정적 최적화 대상이 아니다(Next는 GET에만 캐시를
// 시도한다). `force-dynamic`을 붙이면 "왜 붙였는지" 물음에 답할 이유가
// 없는 채로 관용구만 남으므로 일부러 생략한다.

/**
 * 리포트 본문 크기 상한.
 *
 * 실제 CSP 위반 리포트 한 건은 수백 바이트 수준이고, Reporting API가 여러
 * 건을 배열로 묶어 보내도 몇 KB를 넘기기 어렵다. 이 엔드포인트는 인증이
 * 없는 공개 POST 창구라 아무나 임의 크기의 본문을 보낼 수 있다 — 정상
 * 리포트는 항상 통과시키되, 그보다 훨씬 큰 요청은 리포트가 아니라 남용으로
 * 보고 본문을 다 읽기 전에 끊는다.
 */
const MAX_BODY_BYTES = 16 * 1024; // 16KB

/** 스트림을 읽는 도중 상한을 넘겼다는 표지자. 빈 문자열("")과 구분하려고 심볼을 쓴다. */
const BODY_TOO_LARGE = Symbol("csp-report:body-too-large");

/**
 * 요청 본문을 상한까지만 읽는다.
 *
 * `Content-Length` 헤더만 보고 판단하면 청크 전송처럼 헤더가 없는 요청을
 * 놓친다. 그렇다고 `req.text()`로 통째로 읽으면 헤더가 없거나 거짓인 경우
 * 상한을 넘는 본문도 일단 메모리에 다 올라간 뒤에야 걸러진다. 그래서
 * 스트림을 직접 읽으면서 누적 바이트가 상한을 넘는 순간 바로 멈춘다.
 */
async function readBodyWithinLimit(
  req: Request,
  limitBytes: number,
): Promise<string | typeof BODY_TOO_LARGE> {
  const reader = req.body?.getReader();
  if (!reader) return ""; // 본문 없는 POST — 있을 수 없지만 방어적으로 빈 문자열 취급

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > limitBytes) {
      await reader.cancel();
      return BODY_TOO_LARGE;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf-8");
}

function isRecord(value: unknown): value is Record<string, unknown> {
  return typeof value === "object" && value !== null;
}

function asString(value: unknown): string | undefined {
  return typeof value === "string" ? value : undefined;
}

/** 로그에 남길 필드만 추린 형태. 위반 판단에 실제로 쓰이는 것만 남긴다. */
interface CspViolationLog {
  "blocked-uri"?: string;
  "violated-directive"?: string;
  "document-uri"?: string;
  disposition?: string;
}

/**
 * 구형(`application/csp-report`, 단일 객체·하이픈 필드명)과 신형
 * (`application/reports+json`, 배열·camelCase 필드명) 두 형식을 하나의
 * 로그 모양으로 맞춘다.
 *
 * `Content-Type` 헤더로 미리 분기하지 않고 본문 모양을 보고 판단한다 —
 * 브라우저가 실제로 보내는 타입이 스펙과 어긋나는 사례가 있어, 타입 검사로
 * 거부하면 멀쩡한 리포트를 놓칠 수 있다.
 */
function extractViolations(parsed: unknown): CspViolationLog[] {
  if (Array.isArray(parsed)) {
    // 신형 Reporting API — 여러 리포트를 배열로 묶어 보낸다.
    return parsed.filter(isRecord).map((entry): CspViolationLog => {
      const body = isRecord(entry.body) ? entry.body : {};
      return {
        "blocked-uri": asString(body.blockedURL),
        "violated-directive": asString(body.effectiveDirective),
        "document-uri": asString(body.documentURL),
        disposition: asString(body.disposition),
      };
    });
  }

  if (isRecord(parsed) && isRecord(parsed["csp-report"])) {
    // 구형 report-uri 방식 — 단일 객체.
    const report = parsed["csp-report"];
    return [
      {
        "blocked-uri": asString(report["blocked-uri"]),
        "violated-directive": asString(report["violated-directive"]),
        "document-uri": asString(report["document-uri"]),
        disposition: asString(report["disposition"]),
      },
    ];
  }

  // 알려진 두 형태 어디에도 안 맞는다 — 그래도 요청 자체는 정상 처리한다.
  return [];
}

export async function POST(req: Request) {
  // ① `Content-Length`로 선제 차단 — 헤더만 보고도 상한 초과를 알 수 있으면
  //    스트림을 열 필요조차 없다. 헤더가 없거나 거짓일 수 있어 이것만으로는
  //    부족하다 → ②에서 실제로 읽은 바이트 수에도 상한을 건다.
  const declaredLength = Number(req.headers.get("content-length") ?? "");
  if (Number.isFinite(declaredLength) && declaredLength > MAX_BODY_BYTES) {
    return new Response(null, { status: 413 });
  }

  // ②
  const body = await readBodyWithinLimit(req, MAX_BODY_BYTES);
  if (body === BODY_TOO_LARGE) {
    return new Response(null, { status: 413 });
  }
  if (body.length === 0) {
    return new Response(null, { status: 204 });
  }

  let parsed: unknown;
  try {
    parsed = JSON.parse(body);
  } catch {
    // 봇이 CSP 리포트 형식이 아닌 아무 값이나 이 공개 엔드포인트에 보내는
    // 일이 흔하다. 여기서 400을 돌려주면 그 4xx가 로그를 도배해서 진짜
    // 위반 신호를 덮어버린다 — 조용히 넘기되, 건수는 세어 볼 수 있게
    // 로그 한 줄만 남긴다.
    console.warn("[csp-report] JSON 파싱 실패 — 무시함");
    return new Response(null, { status: 204 });
  }

  for (const violation of extractViolations(parsed)) {
    console.warn("[csp-report] 위반", violation);
  }

  return new Response(null, { status: 204 });
}
