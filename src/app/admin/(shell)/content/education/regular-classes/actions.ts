"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import { getContentData } from "@/lib/admin/content-data";
import { BUNDLE_PATH_RE } from "@/lib/admin/course-bundle";
import { sanitizeCourseHtml } from "@/lib/admin/sanitize-html";
import type {
  BundleIntent,
  EducationRegularClass,
  HtmlIntent,
} from "@/lib/admin/content-types";

/** 5MB. 동반 테이블 CHECK(`education_regular_class_html_raw_size_ck`)와 같은 값 —
 *  클라이언트(html-upload.tsx)를 믿지 않는 지점은 여기 하나다.
 *  next.config.ts의 `serverActions.bodySizeLimit`이 이 값보다 커야 한다.
 *  원본이 액션 인자로 실려 오므로, 작으면 여기 오기도 전에 요청이 잘린다. */
const MAX_RAW_BYTES = 5 * 1024 * 1024;

// detailHtml은 폼이 직접 못 채운다(정제는 서버 전용) — 대신 htmlIntent로
// "무엇을 할지"를 받는다. 번들 두 컬럼도 같은 이유로 intent를 받는다: 폴더
// 삭제가 걸려 있어 "안 건드림"과 "비워라"가 반드시 구분돼야 한다.
type Input = Omit<
  EducationRegularClass,
  "id" | "sortOrder" | "detailHtml" | "detailBundlePath" | "detailBundleName"
> & {
  htmlIntent: HtmlIntent;
  bundleIntent: BundleIntent;
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
    throw new Error("HTML 파일은 5MB 이하여야 합니다.");
  }
  return sanitizeCourseHtml(intent.raw);
}

/**
 * bundleIntent → detail_bundle_* 두 컬럼에 쓸 값. resolveDetailHtml과 같은
 * 규약이다 — "keep"이면 undefined를 돌려줘 호출부가 키 자체를 안 넣는다.
 * 경로는 폼을 우회한 요청도 있을 수 있어 여기서 다시 본다(DB CHECK가 3중 방어).
 */
function resolveBundle(intent: BundleIntent): { path: string; name: string } | undefined {
  if (intent.kind === "keep") return undefined;
  if (intent.kind === "remove") return { path: "", name: "" };

  if (!BUNDLE_PATH_RE.test(intent.path)) {
    throw new Error("번들 경로가 올바르지 않습니다.");
  }
  return { path: intent.path, name: intent.fileName };
}

/**
 * 옛 번들 폴더를 정리한다. 실패해도 삼킨다 — DB는 이미 새 값으로 바뀌었고,
 * 남는 건 아무도 참조하지 않는 고아 폴더다(요구사항 §6). 그걸 이유로 사용자에게
 * "저장 실패"를 보여주면 실제로 저장된 것을 되돌리려 들게 된다.
 */
async function discardBundleFolder(path: string, keep: string) {
  if (!path || path === keep) return;
  try {
    await getContentData().education.regularClasses.removeBundleFolder(path);
  } catch (e) {
    console.error("번들 폴더 정리 실패(고아 폴더로 남음):", path, e);
  }
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
  const { htmlIntent, bundleIntent, ...rest } = normalize(input);
  // create()는 detailHtml이 필수 필드라 "keep"(새 글에서는 "아직 없음")도
  // 빈 문자열로 채운다. 번들 두 필드도 같은 이유로 채운다.
  const detailHtml = resolveDetailHtml(htmlIntent) ?? "";
  const bundle = resolveBundle(bundleIntent) ?? { path: "", name: "" };

  const created = await getContentData().education.regularClasses.create({
    ...rest,
    detailHtml,
    detailBundlePath: bundle.path,
    detailBundleName: bundle.name,
  });
  await syncHtmlSource(created.id, htmlIntent);

  revalidatePath(LIST);
  revalidatePublic(rest.slug);
  redirect(LIST);
}

export async function updateRegularClass(id: string, input: Input) {
  const { htmlIntent, bundleIntent, ...rest } = normalize(input);
  const detailHtml = resolveDetailHtml(htmlIntent);
  const bundle = resolveBundle(bundleIntent);

  // 순서를 뒤집으면 안 된다(05 §5-2): 옛 경로를 먼저 확보하고, update가 성공한
  // 뒤에만 옛 폴더를 지운다. 먼저 지웠다가 update가 실패하면 화면에는 살아 있는
  // 번들이 Storage에서만 사라진다. 이 순서면 최악이 고아 폴더(무해)다.
  const previous = bundle ? await getContentData().education.regularClasses.get(id) : null;

  await getContentData().education.regularClasses.update(id, {
    ...rest,
    // detailHtml이 undefined("keep")면 키 자체를 안 넣는다 — toRow가
    // undefined를 스킵하므로 기존 값을 건드리지 않는다. 번들도 같다.
    ...(detailHtml !== undefined ? { detailHtml } : {}),
    ...(bundle !== undefined
      ? { detailBundlePath: bundle.path, detailBundleName: bundle.name }
      : {}),
  });
  await syncHtmlSource(id, htmlIntent);
  if (bundle && previous) await discardBundleFolder(previous.detailBundlePath, bundle.path);

  revalidatePath(LIST);
  revalidatePath(`${LIST}/${id}`);
  revalidatePublic(rest.slug);
  redirect(LIST);
}

export async function deleteRegularClass(id: string) {
  // 행이 사라지면 경로를 알 방법이 없으므로 먼저 읽어 둔다.
  const previous = await getContentData().education.regularClasses.get(id);
  // slug를 모른 채 지우므로 상세 경로는 개별 무효화하지 않는다. 지워진 행은
  // 다음 요청에서 조회가 비어 notFound()로 떨어지므로 문제되지 않는다.
  await getContentData().education.regularClasses.remove(id);
  if (previous) await discardBundleFolder(previous.detailBundlePath, "");

  revalidatePath(LIST);
  revalidatePublic();
}

export async function setRegularClassPublished(id: string, next: boolean) {
  await getContentData().education.regularClasses.update(id, { isPublished: next });
  revalidatePath(LIST);
  revalidatePublic();
}
