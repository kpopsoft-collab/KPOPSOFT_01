import type { DeliveryAttempt, Inquiry } from "../admin/types";

export type LinearIssueConfig = {
  teamId: string;
  projectId?: string;
  adminBaseUrl: string;
};

export type LinearIssueInput = {
  teamId: string;
  projectId?: string;
  title: string;
  description: string;
};

function withoutTrailingSlash(value: string): string {
  return value.replace(/\/+$/, "");
}

export function buildLinearIssueInput(
  inquiry: Inquiry,
  config: LinearIssueConfig,
): LinearIssueInput {
  const detailUrl = `${withoutTrailingSlash(config.adminBaseUrl)}/${inquiry.id}`;
  return {
    teamId: config.teamId,
    ...(config.projectId ? { projectId: config.projectId } : {}),
    title: `[${inquiry.type}] ${inquiry.subtype} · ${inquiry.sender || "이름 미기재"}`,
    description: [
      `문의 ID: ${inquiry.id}`,
      `접수 시각: ${inquiry.createdAt}`,
      `유형: ${inquiry.type} / ${inquiry.subtype}`,
      `보낸 사람: ${inquiry.sender || "(미기재)"}`,
      `연락처: ${inquiry.contact || "(미기재)"}`,
      `관리자 페이지: ${detailUrl}`,
      "",
      "## 문의 내용",
      inquiry.message,
    ].join("\n"),
  };
}

function linearErrorCode(error: unknown): string {
  const type =
    typeof error === "object" && error && "type" in error
      ? String(error.type)
      : "";
  const status =
    typeof error === "object" && error && "status" in error
      ? Number(error.status)
      : 0;
  if (
    status === 401 ||
    status === 403 ||
    type === "AuthenticationError" ||
    type === "Forbidden"
  ) {
    return "unauthorized";
  }
  if (status === 429 || type === "Ratelimited") return "throttled";
  return "provider_error";
}

export async function createLinearIssue(
  inquiry: Inquiry,
): Promise<DeliveryAttempt> {
  if (inquiry.linearIssueId) {
    return {
      ok: true,
      externalId: inquiry.linearIssueId,
      skipped: true,
      ...(inquiry.linearIssueUrl ? { url: inquiry.linearIssueUrl } : {}),
    };
  }

  const apiKey = process.env.LINEAR_API_KEY?.trim();
  const teamId = process.env.LINEAR_TEAM_ID?.trim();
  const projectId = process.env.LINEAR_PROJECT_ID?.trim();
  const siteUrl = (
    process.env.NEXT_PUBLIC_SITE_URL ?? "https://kpopsoft.com"
  ).trim();
  if (!apiKey || !teamId) {
    return { ok: false, errorCode: "configuration_error" };
  }

  const { LinearClient } = await import("@linear/sdk");
  const client = new LinearClient({ apiKey });
  try {
    const payload = await client.createIssue(
      buildLinearIssueInput(inquiry, {
        teamId,
        ...(projectId ? { projectId } : {}),
        adminBaseUrl: `${withoutTrailingSlash(siteUrl)}/admin/inquiries`,
      }),
    );
    const issue = await payload.issue;
    if (!payload.success || !issue?.id || !issue.url) {
      return { ok: false, errorCode: "provider_error" };
    }
    return { ok: true, externalId: issue.id, url: issue.url };
  } catch (error) {
    return { ok: false, errorCode: linearErrorCode(error) };
  }
}
