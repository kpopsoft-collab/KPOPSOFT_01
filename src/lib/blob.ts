import "server-only";

import { del, list } from "@vercel/blob";

/**
 * Vercel Blob 공통 — Supabase Storage를 대체한다.
 *
 * Supabase의 `<bucket>/<path>` 구조를 Blob pathname에 그대로 옮겼다
 * (예: `education/<uuid>/index.html`, `work/<uuid>.png`). 버킷 이름이 곧
 * 첫 경로 세그먼트다. 기존 파일 복사(scripts/migrate-from-supabase.ts)도
 * 같은 규칙을 따른다.
 */

export function isBlobConfigured(): boolean {
  return Boolean(process.env.BLOB_READ_WRITE_TOKEN);
}

/** prefix 아래 객체를 전부 지운다. Blob의 list는 재귀(평면)이고 페이지가 있다. */
export async function deleteBlobPrefix(prefix: string): Promise<void> {
  let cursor: string | undefined;
  do {
    const page = await list({ prefix, cursor, limit: 1000 });
    if (page.blobs.length > 0) {
      await del(page.blobs.map((b) => b.url));
    }
    cursor = page.hasMore ? page.cursor : undefined;
  } while (cursor);
}
