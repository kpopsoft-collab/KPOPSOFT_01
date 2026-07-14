/**
 * Admin domain types — the shared contract for the admin build.
 * See docs/어드민기획.md §4 (data model) / §11.8 (DB-excluded seam mode).
 * These shapes are DB-agnostic on purpose: the mock adapter and the future
 * Supabase adapter both satisfy them, so screens never change on wiring day.
 */

export type InquiryStatus = "new" | "in_progress" | "done";
export type DeliveryStatus = "pending" | "sent" | "failed";
export type LinearDeliveryStatus = "pending" | "created" | "failed";

export type DeliveryAttempt =
  | { ok: true; externalId: string; skipped?: boolean; url?: string }
  | { ok: false; errorCode: string };

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
  submissionKey: string;
  type: string;
  subtype: string;
  sender: string;
  contact: string;
  message: string;
  status: InquiryStatus;
  memo: string;
  emailStatus: DeliveryStatus;
  emailMessageId: string | null;
  emailSentAt: string | null;
  emailError: string | null;
  linearStatus: LinearDeliveryStatus;
  linearIssueId: string | null;
  linearIssueUrl: string | null;
  linearError: string | null;
  /** ISO 8601 timestamps. */
  createdAt: string;
  updatedAt: string;
};

export type InquiryDeliveryPatch = Partial<
  Pick<
    Inquiry,
    | "emailStatus"
    | "emailMessageId"
    | "emailSentAt"
    | "emailError"
    | "linearStatus"
    | "linearIssueId"
    | "linearIssueUrl"
    | "linearError"
  >
>;

/** Payload the public contact form sends (docs §7). No status/memo — server sets those. */
export type NewInquiry = Pick<
  Inquiry,
  "type" | "subtype" | "sender" | "contact" | "message"
>;

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
