"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { upload } from "@vercel/blob/client";

import { cn } from "@/lib/utils";

/**
 * Image upload widget (docs §4.2, §8 — 강사/Work/Insights 커버, 공통 재사용).
 *
 * Uploads the chosen file straight to Vercel Blob under `<bucket>/<uuid>.<ext>`
 * (client-side; `/api/admin/blob-upload` checks the admin session and issues a
 * scoped token) and reports the resulting public URL via `onChange`. A hidden input named `name` submits that URL with
 * the form's server action. Format/size are validated before upload.
 */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
/** 토큰 발급 라우트 — 관리자 확인·경로/형식 제한을 거기서 건다. */
const BLOB_UPLOAD_URL = "/api/admin/blob-upload";
const MAX_BYTES = 5 * 1024 * 1024;
const EXT: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
};

export function ImageUpload({
  value,
  onChange,
  bucket,
  name = "imageUrl",
  label = "이미지",
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  /** Blob 경로의 첫 세그먼트(옛 Supabase 버킷): "experts" | "work" | "education". */
  bucket: string;
  name?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [uploading, setUploading] = useState(false);

  const handleFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;
    if (!ACCEPTED.includes(file.type)) {
      setError("JPG · PNG · WEBP 형식만 올릴 수 있어요.");
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("이미지 용량은 5MB 이하여야 해요.");
      return;
    }

    setUploading(true);
    try {
      const path = `${bucket}/${crypto.randomUUID()}.${EXT[file.type] ?? "jpg"}`;
      const blob = await upload(path, file, {
        access: "public",
        handleUploadUrl: BLOB_UPLOAD_URL,
        contentType: file.type,
      });
      onChange(blob.url);
    } catch {
      setError("업로드에 실패했습니다. 잠시 후 다시 시도해 주세요.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <div className="flex items-center gap-4">
        <div
          className={cn(
            "flex size-24 shrink-0 items-center justify-center overflow-hidden rounded-2xl border border-dashed border-ink/25 bg-ivory/60",
            value && "border-solid",
          )}
        >
          {value ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img
              src={value}
              alt="미리보기"
              className="size-full object-cover"
            />
          ) : (
            <ImagePlus className="size-6 text-ink/35" aria-hidden />
          )}
        </div>

        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            <ImagePlus className="size-4" aria-hidden />
            {uploading ? "업로드 중…" : value ? "이미지 변경" : "이미지 올리기"}
          </button>
          {value && (
            <button
              type="button"
              onClick={() => {
                onChange(undefined);
                if (inputRef.current) inputRef.current.value = "";
              }}
              className="inline-flex min-h-9 items-center gap-1.5 rounded-full px-4 text-sm font-semibold text-brand-red/90 transition-colors hover:bg-brand-red/10"
            >
              <X className="size-4" aria-hidden />
              제거
            </button>
          )}
        </div>
      </div>

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-red">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={ACCEPTED.join(",")}
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
      <input type="hidden" name={name} value={value ?? ""} />
    </div>
  );
}
