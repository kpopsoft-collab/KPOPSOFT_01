import "server-only";

/**
 * 문의 알림 메일 (docs/06-admin/ §7, §8, §11.8 · KPO-23 승인 설계 §7).
 *
 * `submitInquiry`(src/lib/inquiry-actions.ts)가 문의를 저장한 직후 호출한다.
 * 발송은 **Cloudflare Email Service**로 한다 — Resend가 아니다.
 * 경위와 근거 — docs/08-decisions/09-inquiry-email-notification/.
 *
 * 실패해도 던지지 않는다. 호출부의 best-effort catch에 기대지 않고 여기서
 * 끝낸다 — "발송 실패해도 저장은 성공 처리"가 기준이다(docs/06-admin/03…:47).
 *
 * ⚠️ 조용히 실패하지 않는다. 이 기능이 두 달 넘게 죽어 있었는데 아무도 몰랐던
 * 이유가 `console.info` 한 줄이었다. 미발송은 전부 warn 이상으로, **문의 id와
 * 함께** 남긴다 — id가 있어야 어드민에서 그 건을 찾아 수동 대응할 수 있다.
 */

import type { Inquiry } from "@/lib/admin/types";
import { sendInquiryEmail } from "@/lib/integrations/cloudflare-email";

/** 미발송을 한 형식으로 남긴다. 운영에서는 error — 정상 상태가 아니다. */
function reportNotSent(inquiry: Inquiry, errorCode: string): void {
  const line = `[email] 문의 알림 미발송 — ${errorCode} (inquiry ${inquiry.id})`;
  const detail = {
    id: inquiry.id,
    type: inquiry.type,
    subtype: inquiry.subtype,
    sender: inquiry.sender,
    createdAt: inquiry.createdAt,
  };
  if (process.env.NODE_ENV === "production") {
    console.error(line, detail);
  } else {
    console.warn(line, detail);
  }
}

export async function notifyNewInquiry(inquiry: Inquiry): Promise<void> {
  const attempt = await sendInquiryEmail(inquiry);

  if (!attempt.ok) {
    reportNotSent(inquiry, attempt.errorCode ?? "unknown");
    return;
  }

  console.info("[email] 문의 알림 접수됨", {
    id: inquiry.id,
    messageId: attempt.externalId,
  });
}
