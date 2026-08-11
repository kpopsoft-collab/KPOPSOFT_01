/**
 * Admin domain types — the shared contract for the admin build.
 * See docs/06-admin/ §4 (data model) / §11.8 (DB-excluded seam mode).
 * These shapes are DB-agnostic on purpose: the mock adapter and the future
 * Supabase adapter both satisfy them, so screens never change on wiring day.
 */

export type InquiryStatus = "new" | "in_progress" | "done";

export const INQUIRY_STATUSES: readonly InquiryStatus[] = [
  "new",
  "in_progress",
  "done",
] as const;

/** Korean labels for the status enum (admin UI). */
export const inquiryStatusLabel: Record<InquiryStatus, string> = {
  new: "신규",
  in_progress: "응대중",
  done: "완료",
};

/**
 * Brand accent per status — §6 hue mapping (new=blue, in_progress=yellow,
 * done=mint) rendered as a pale tint of the hue + colored text of the same hue.
 * Yellow/mint use their darkened `-ink` companions so the text clears WCAG AA.
 */
export const inquiryStatusAccent: Record<InquiryStatus, string> = {
  new: "bg-brand-blue/12 text-brand-blue",
  in_progress: "bg-brand-yellow/25 text-brand-yellow-ink",
  done: "bg-brand-mint/20 text-brand-mint-ink",
};

/**
 * A submitted inquiry. `type`/`subtype` are label snapshots (docs §4.1) so past
 * inquiries stay readable even if the form options later change.
 */
export type Inquiry = {
  id: string;
  type: string;
  subtype: string;
  sender: string;
  contact: string;
  message: string;
  status: InquiryStatus;
  memo: string;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
};

/** Payload the public contact form sends (docs §7). No status/memo — server sets those. */
export type NewInquiry = Pick<
  Inquiry,
  "type" | "subtype" | "sender" | "contact" | "message"
>;

/**
 * 외부 발송(메일 등) 1회 시도의 결과.
 *
 * `ok`는 **제공자가 접수했다**는 뜻이지 수신함에 꽂혔다는 뜻이 아니다 —
 * Cloudflare Email Sending API로 확인 가능한 범위가 접수까지다.
 * 판정 규칙과 그 근거는 docs/08-decisions/09-inquiry-email-notification/ D7.
 */
export type DeliveryAttempt = {
  ok: boolean;
  /** 제공자가 발급한 식별자. 추적에 쓴다. */
  externalId?: string;
  /** 실패 사유. 로그에 그대로 찍히므로 사람이 읽을 수 있는 값으로 둔다. */
  errorCode?: string;
};

export type InquiryStats = {
  total: number;
  new: number;
  in_progress: number;
  done: number;
  /** Count created since local midnight. */
  today: number;
};

export type InquiryFilter = {
  status?: InquiryStatus;
  type?: string;
  /** Free-text match over sender/message. */
  query?: string;
};
