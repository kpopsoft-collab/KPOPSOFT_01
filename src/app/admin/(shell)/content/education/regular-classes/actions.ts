"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { sanitizeCourseHtml } from "@/lib/admin/sanitize-html";
import type { EducationRegularClass, HtmlIntent } from "@/lib/admin/content-types";

/** 512KB. 동반 테이블 CHECK(`education_regular_class_html_raw_size_ck`)와 같은 값 —
 *  클라이언트(html-upload.tsx)를 믿지 않는 지점은 여기 하나다. */
const MAX_RAW_BYTES = 512 * 1024;

// detailHtml은 폼이 직접 못 채운다(정제는 서버 전용) — 대신 htmlIntent로
// "무엇을 할지"를 받는다.
type Input = Omit<EducationRegularClass, "id" | "sortOrder" | "detailHtml"> & {
  htmlIntent: HtmlIntent;
};

const LIST = "/admin/content/education/regular-classes";
/**
 * 공개 페이지도 함께 무효화한다 — 어드민에서 고친 게 바로 보이지 않으면
 * 고친 줄 모른다. 정규 클래스는 세 곳에 나온다: /education 섹션, 목록 페이지,
 * 그리고 slug 상세. 상세는 slug별로 따로 무효화해야 한다.
 */
const PUBLIC_PATHS = ["/education", "/education/programs"];

function revalidatePublic(slug?: string) {
  for (const p of PUBLIC_PATHS) revalidatePath(p);
  if (slug) revalidatePath(`/education/programs/${slug}`);
}

/** oneday면 종료일을 버린다 — DB CHECK(education_regular_classes_schedule_ck)와 같은 규칙. */
function normalize(input: Input): Input {
  if (input.scheduleType !== "oneday") return input;
  return { ...input, endDate: "" };
}

/**
 * htmlIntent → detail_html에 쓸 값. "keep"이면 undefined를 돌려줘 호출부가
 * detail_html 자체를 patch에서 빼게 한다 — 그래야 이름만 고쳐 저장해도
 * 기존 정제본이 그대로 남는다.
 */
function resolveDetailHtml(intent: HtmlIntent): string | undefined {
  if (intent.kind === "keep") return undefined;
  if (intent.kind === "remove") return "";

  if (typeof intent.raw !== "string") {
    throw new Error("HTML 원본이 올바르지 않습니다.");
  }
  if (Buffer.byteLength(intent.raw, "utf8") > MAX_RAW_BYTES) {
    throw new Error("HTML 파일은 512KB 이하여야 합니다.");
  }
  return sanitizeCourseHtml(intent.raw);
}

/** 동반 테이블(업로드 원본)을 htmlIntent에 맞게 반영한다. keep은 아무 것도 하지 않는다. */
async function syncHtmlSource(classId: string, intent: HtmlIntent) {
  const repo = getContentData().education.regularClasses;
  if (intent.kind === "replace") {
    await repo.upsertHtmlSource(classId, intent.raw, intent.fileName);
  } else if (intent.kind === "remove") {
    await repo.deleteHtmlSource(classId);
  }
}

export async function createRegularClass(input: Input) {
  const { htmlIntent, ...rest } = normalize(input);
  // create()는 detailHtml이 필수 필드라 "keep"(새 글에서는 "아직 없음")도
  // 빈 문자열로 채운다.
  const detailHtml = resolveDetailHtml(htmlIntent) ?? "";

  const created = await getContentData().education.regularClasses.create({
    ...rest,
    detailHtml,
  });
  await syncHtmlSource(created.id, htmlIntent);

  revalidatePath(LIST);
  revalidatePublic(rest.slug);
  redirect(LIST);
}

export async function updateRegularClass(id: string, input: Input) {
  const { htmlIntent, ...rest } = normalize(input);
  const detailHtml = resolveDetailHtml(htmlIntent);

  await getContentData().education.regularClasses.update(id, {
    ...rest,
    // detailHtml이 undefined("keep")면 키 자체를 안 넣는다 — toRow가
    // undefined를 스킵하므로 기존 값을 건드리지 않는다.
    ...(detailHtml !== undefined ? { detailHtml } : {}),
  });
  await syncHtmlSource(id, htmlIntent);

  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePublic(rest.slug);
  redirect(LIST);
}

export async function deleteRegularClass(id: string) {
  // slug를 모른 채 지우므로 상세 경로는 개별 무효화하지 않는다. 지워진 행은
  // 다음 요청에서 조회가 비어 notFound()로 떨어지므로 문제되지 않는다.
  await getContentData().education.regularClasses.remove(id);
  revalidatePath(LIST);
  revalidatePublic();
}

export async function setRegularClassPublished(id: string, next: boolean) {
  await getContentData().education.regularClasses.update(id, { isPublished: next });
  revalidatePath(LIST);
  revalidatePublic();
}
