import "server-only";

/**
 * Cloudflare Email Sending 어댑터 (KPO-23 승인 설계 §7).
 *
 * `origin/codex/kpopsoft-maxonomy-concept-wind`의 같은 이름 파일에서 이식하되
 * **응답 판정을 고쳤다.** 경위 — docs/08-decisions/09-inquiry-email-notification/ D7.
 *
 * Env (전부 있어야 발송한다):
 *   CLOUDFLARE_API_TOKEN        — `Email Sending: Edit` 최소 권한
 *   CLOUDFLARE_ACCOUNT_ID
 *   INQUIRY_NOTIFICATION_FROM   — 예: inquiry@kpopsoft.com
 *   INQUIRY_NOTIFICATION_TO     — Cloudflare에서 **검증된** 주소여야 한다
 *
 * ⚠️ 수신자는 검증된 주소로 제한한다. 검증된 주소로 보내는 메일만 전 플랜
 * 무료이고, 임의 수신자로 넓히면 Workers 유료 플랜이 필요하다(설계 §7 무료 조건).
 */

import type { DeliveryAttempt, Inquiry } from "@/lib/admin/types";
import { buildInquiryEmail } from "@/lib/inquiries/email-message";

/** `POST /accounts/{id}/email/sending/send`의 응답. */
type CloudflareEmailResponse = {
  message_id?: string;
  delivered?: string[];
  queued?: string[];
  permanent_bounces?: string[];
};

/**
 * 응답 → 판정.
 *
 * **`delivered`가 비었다고 실패가 아니다.** 2026-08-11 실측에서 정상 발송
 * (수신 확인됨)의 응답이 `delivered`·`queued`·`permanent_bounces` **전부 빈**
 * 모양이었다. 이식 원본은 이 경우를 `provider_error`로 떨어뜨려서, 성공할
 * 때마다 거짓 실패 로그를 남겼다.
 *
 * 그래서 판정 기준을 **접수 여부**로 옮긴다 — 이 API로 확인 가능한 범위가
 * 거기까지다. 확인 못 하는 것(최종 전달)을 확인한 척하지 않는다.
 * 단 `permanent_bounces`는 명시적 거부이므로 그대로 실패로 잡는다.
 */
export function mapCloudflareEmailResponse(
  response: CloudflareEmailResponse,
  httpOk: boolean,
  apiSuccess: boolean,
): DeliveryAttempt {
  if ((response.permanent_bounces?.length ?? 0) > 0) {
    return { ok: false, errorCode: "permanent_bounce" };
  }
  if (httpOk && apiSuccess && response.message_id) {
    return { ok: true, externalId: response.message_id };
  }
  return { ok: false, errorCode: "provider_error" };
}

function providerErrorCode(status: number): string {
  if (status === 401 || status === 403) return "unauthorized";
  if (status === 429) return "throttled";
  return "provider_error";
}

/**
 * 문의 알림 메일 1통. 던지지 않고 항상 `DeliveryAttempt`를 돌려준다 —
 * 호출부(`notifyNewInquiry`)가 실패를 로그로만 남기고 저장을 지키기 때문이다.
 */
export async function sendInquiryEmail(
  inquiry: Inquiry,
): Promise<DeliveryAttempt> {
  const apiToken = process.env.CLOUDFLARE_API_TOKEN?.trim();
  const accountId = process.env.CLOUDFLARE_ACCOUNT_ID?.trim();
  const from = process.env.INQUIRY_NOTIFICATION_FROM?.trim();
  const to = (process.env.INQUIRY_NOTIFICATION_TO ?? "")
    .split(",")
    .map((address) => address.trim())
    .filter(Boolean);

  if (!apiToken || !accountId || !from || to.length === 0) {
    return { ok: false, errorCode: "configuration_error" };
  }

  const { subject, text, html, replyTo } = buildInquiryEmail(inquiry);

  try {
    const res = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/email/sending/send`,
      {
        method: "POST",
        headers: {
          Authorization: `Bearer ${apiToken}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          from,
          // 수신자가 하나면 문자열, 여럿이면 배열로 보낸다.
          to: to.length === 1 ? to[0] : to,
          subject,
          text,
          html,
          ...(replyTo ? { reply_to: replyTo } : {}),
        }),
      },
    );

    if (!res.ok) {
      return { ok: false, errorCode: providerErrorCode(res.status) };
    }

    const body = (await res.json()) as {
      success?: boolean;
      result?: CloudflareEmailResponse;
    };
    return mapCloudflareEmailResponse(
      body.result ?? {},
      res.ok,
      body.success === true,
    );
  } catch {
    // 네트워크/파싱 실패. 토큰이 섞일 수 있으므로 원본 오류를 흘리지 않는다.
    return { ok: false, errorCode: "network_error" };
  }
}
