export const IMAGE_CONTENT_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
export const MAX_IMAGE_BYTES = 10 * 1024 * 1024;

const IMAGE_TYPE_SET = new Set<string>(IMAGE_CONTENT_TYPES);
const IMAGE_PATH_PATTERN =
  /^(experts|work|insights)\/[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}\.(jpg|png|webp)$/i;

export function validateImageUpload(input: {
  contentType: string;
  size: number;
}): { ok: true } | { ok: false; error: string } {
  if (!IMAGE_TYPE_SET.has(input.contentType)) {
    return {
      ok: false,
      error: "JPG · PNG · WEBP 형식만 올릴 수 있어요.",
    };
  }
  if (!Number.isFinite(input.size) || input.size < 0 || input.size > MAX_IMAGE_BYTES) {
    return { ok: false, error: "이미지 용량은 10MB 이하여야 해요." };
  }
  return { ok: true };
}

export function isAllowedImagePathname(pathname: string): boolean {
  return IMAGE_PATH_PATTERN.test(pathname);
}
