import { handleUpload, type HandleUploadBody } from "@vercel/blob/client";
import { NextResponse } from "next/server";

import { getAdminSession } from "@/lib/admin/auth";
import { BUNDLE_BUCKET, BUNDLE_PATH_RE, EXT_MIME, MAX_FILE_BYTES } from "@/lib/admin/course-bundle";

/**
 * 어드민 클라이언트 업로드용 Vercel Blob 토큰 발급 (Supabase Storage 대체).
 *
 * 파일은 브라우저 → Blob으로 직접 간다(함수 본문 4.5MB 한도를 피한다). 이
 * 라우트는 관리자 확인 + 경로·형식·크기 제한을 건 단기 토큰만 내준다.
 * Supabase 시절 버킷 정책(쓰기는 is_admin())과 같은 역할이다.
 *
 * 허용 경로 (Supabase `<bucket>/<path>` 모양 그대로):
 *   - 이미지:  `<experts|work|education>/<uuid>.<jpg|png|webp>`
 *   - 번들:    `education/<uuid>/<파일 경로>`
 */
const IMAGE_BUCKETS = new Set(["experts", "work", "education"]);
const IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];
const UUID = "[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}";
const IMAGE_PATH_RE = new RegExp(`^([a-z]+)/${UUID}\\.(jpg|png|webp)$`);

function allowedTypesFor(pathname: string): string[] | null {
  const image = IMAGE_PATH_RE.exec(pathname);
  if (image && IMAGE_BUCKETS.has(image[1])) return IMAGE_TYPES;

  const prefix = `${BUNDLE_BUCKET}/`;
  if (pathname.startsWith(prefix)) {
    const rest = pathname.slice(prefix.length);
    const slash = rest.indexOf("/");
    const folder = rest.slice(0, slash + 1);
    const file = rest.slice(slash + 1);
    if (slash > 0 && BUNDLE_PATH_RE.test(folder) && file.length > 0) {
      // planBundle()이 이미 걸렀지만 서버에서 다시 막는다 — 토큰은 이 경로에만 유효하다.
      if (file.split("/").some((s) => s === "" || s === "." || s === "..")) return null;
      return Array.from(new Set(Object.values(EXT_MIME)));
    }
  }
  return null;
}

export async function POST(request: Request): Promise<NextResponse> {
  const body = (await request.json()) as HandleUploadBody;

  try {
    const json = await handleUpload({
      body,
      request,
      onBeforeGenerateToken: async (pathname) => {
        if (!(await getAdminSession())) {
          throw new Error("Unauthorized");
        }
        const allowedContentTypes = allowedTypesFor(pathname);
        if (!allowedContentTypes) {
          throw new Error(`Pathname not allowed: ${pathname}`);
        }
        return {
          allowedContentTypes,
          maximumSizeInBytes: MAX_FILE_BYTES,
          addRandomSuffix: false,
          allowOverwrite: false,
          // 업로드마다 새 UUID 경로라 내용이 바뀌지 않는다 — 길게 캐시해도 안전하다.
          cacheControlMaxAge: 31536000,
        };
      },
    });
    return NextResponse.json(json);
  } catch (error) {
    const message = error instanceof Error ? error.message : "Upload failed";
    const status = message === "Unauthorized" ? 401 : 400;
    return NextResponse.json({ error: message }, { status });
  }
}
