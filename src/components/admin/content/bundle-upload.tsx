"use client";

import { useRef, useState } from "react";
import { AlertTriangle, FileArchive, X } from "lucide-react";
import { unzipSync } from "fflate";

import { createSupabaseBrowserClient } from "@/lib/supabase/client";
import { BUNDLE_BUCKET, planBundle, type BundleFile } from "@/lib/admin/course-bundle";

/**
 * 과정 상세 자료 업로드 위젯 (백로그 05 §1 4단계, 백로그 06 04-구현계획 5단계).
 *
 * **zip 번들과 `.html` 한 장을 둘 다 받는다.** `.html`은 압축을 푸는 단계만
 * 건너뛰고 나머지 경로를 그대로 탄다 — 어느 쪽으로 올려도 결과는 같은 모양
 * (`education/<uuid>/index.html`)이고, 공개 페이지에는 같은 "상세 자료" 링크
 * 하나로 나온다(백로그 06 D2).
 *
 * 흐름: 파일 선택 → (zip이면) 브라우저 메모리에서 해제(fflate) → `planBundle()`로 정규화·검증
 * → 통과하면 파일별로 Supabase Storage(`education/<uuid>/…`)에 올린다.
 * 과정 이미지와 같은 버킷이지만 이미지는 루트에 `<uuid>.<ext>`로 있어 겹치지 않는다.
 * 서버 왕복 없이 클라이언트에서 완결되므로, 저장(다른 필드와 함께 서버 액션)은
 * 별도로 눌러야 한다 — 이 위젯은 "올리기"만 하고 "반영"은 하지 않는다.
 *
 * 하나라도 업로드가 실패하면 중단하고 에러만 보여준다. 이미 올라간 파일은
 * Storage에 고아로 남는데, DB에 경로가 기록되지 않으므로 화면에는 영향이 없다
 * (백로그 05 01-요구사항.md §6 — 알고 남기는 부채).
 */
const CONCURRENCY = 4;

export function BundleUpload({
  path,
  fileName,
  onChange,
  onRemove,
  onBusyChange,
  label = "상세 자료 (zip 또는 HTML 한 장)",
}: {
  /** 현재 붙어 있는 번들 폴더('<uuid>/'). 빈 문자열이면 없음. */
  path: string;
  /** 올린 zip의 원래 파일명. */
  fileName: string;
  onChange: (path: string, fileName: string) => void;
  onRemove: () => void;
  /** 업로드 중에는 폼이 저장을 막아야 한다 — 지금 저장하면 intent가 아직
   *  "keep"이라 컬럼은 안 붙고 올라간 파일 수십 개만 고아로 남는다. */
  onBusyChange?: (busy: boolean) => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<{ done: number; total: number } | null>(null);
  // Storage를 조회해 다시 세지 않는다 — 이번 업로드에서만 아는 값이라 새로 열면 사라진다.
  const [uploadedCount, setUploadedCount] = useState<number | null>(null);

  const handleFile = async (file: File | undefined) => {
    setError(null);
    setWarnings([]);
    if (!file) return;

    const isHtml = /\.html?$/i.test(file.name);
    if (!isHtml && !/\.zip$/i.test(file.name)) {
      setError("zip 또는 HTML(.html) 파일만 올릴 수 있어요.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    setUploading(true);
    onBusyChange?.(true);
    setProgress(null);
    try {
      const buffer = await file.arrayBuffer();

      /**
       * 업로드할 파일들 — `planBundle()`의 `from` 이름으로 바이트를 찾는 맵.
       *
       * zip이면 압축을 푼 결과 그대로다. `.html` 한 장이면 **압축을 푸는
       * 단계만 건너뛰고** 나머지(검증·업로드·경로 모양)는 zip과 똑같은
       * 경로를 탄다(백로그 06 04-구현계획 5단계).
       *
       * `.html`을 여기로 보내는 이유 — 예전에는 `.html`을 서버 액션으로
       * 보내 정제한 뒤 `detail_html` 컬럼에 넣고 공개 페이지에 인라인으로
       * 그렸는데, 정제가 `<script>`와 `@keyframes`를 지워 완성된 문서
       * 한 장이 빈 화면으로 나왔다(백로그 06 01-현황분석 §2·§3).
       * Storage에 올리면 격리된 origin에서 **원본 그대로** 새 탭에 열린다.
       */
      let source: Record<string, Uint8Array>;
      if (isHtml) {
        // 이름은 반드시 index.html이어야 한다 — planBundle이 진입 파일을
        // 그 이름으로 찾고, 공개 리더도 `<uuid>/index.html`로 URL을 만든다.
        source = { "index.html": new Uint8Array(buffer) };
      } else {
        try {
          source = unzipSync(new Uint8Array(buffer));
        } catch {
          setError("zip 파일을 열 수 없습니다. 손상되지 않았는지 확인해 주세요.");
          return;
        }
      }

      // 디렉터리 엔트리(끝이 "/")는 파일이 아니다 — planBundle에 넘길 목록에서 뺀다.
      const entries = Object.entries(source)
        .filter(([name]) => !name.endsWith("/"))
        .map(([name, data]) => ({ name, size: data.length }));

      const plan = planBundle(entries);
      if (!plan.ok) {
        setError(plan.error);
        return;
      }
      if (plan.warnings.length > 0) setWarnings(plan.warnings);

      const total = plan.files.length;
      setProgress({ done: 0, total });

      const supabase = createSupabaseBrowserClient();
      const bundlePath = `${crypto.randomUUID()}/`;

      let done = 0;
      let failedAt: string | null = null;
      // Storage가 준 이유를 그대로 보여 준다. "잠시 후 다시 시도"로 뭉개면
      // 정책(RLS)·MIME 거부처럼 다시 시도해도 절대 안 되는 실패를 구분할 수 없다.
      let failedWhy = "";
      let cursor = 0;

      const uploadOne = async (f: BundleFile) => {
        // fflate가 돌려주는 Uint8Array는 버퍼 타입이 ArrayBufferLike(SharedArrayBuffer
        // 포함)로 넓어 BlobPart에 바로 안 맞는다 — 새 Uint8Array로 복사해 좁힌다.
        // 파일 하나 최대 5MB(MAX_FILE_BYTES)라 복사 비용은 무시할 만하다.
        const bytes = new Uint8Array(source[f.from]);
        const blob = new Blob([bytes], { type: f.mime });
        // 던지는 예외도 여기서 삼켜 failedAt으로 바꾼다 — 밖으로 새면 Promise.all이
        // 즉시 reject되고 남은 워커들이 뒤에서 계속 돌며 진행 표시를 되살린다.
        try {
          const { error: uploadError } = await supabase.storage
            .from(BUNDLE_BUCKET)
            .upload(`${bundlePath}${f.to}`, blob, {
              contentType: f.mime,
              upsert: false,
              // 번들 폴더는 업로드마다 새 UUID라 내용이 절대 바뀌지 않는다 — 길게 캐시해도 안전하다.
              cacheControl: "31536000",
            });
          if (uploadError) {
            failedWhy = uploadError.message;
            failedAt = f.to;
          }
        } catch (e) {
          failedWhy = e instanceof Error ? e.message : String(e);
          failedAt = f.to;
        }
      };

      const worker = async () => {
        while (cursor < plan.files.length && !failedAt) {
          const f = plan.files[cursor];
          cursor += 1;
          await uploadOne(f);
          if (!failedAt) {
            done += 1;
            setProgress({ done, total });
          }
        }
      };

      await Promise.all(
        Array.from({ length: Math.min(CONCURRENCY, plan.files.length) }, () => worker()),
      );

      if (failedAt) {
        setError(
          `업로드 실패 — ${failedAt}: ${failedWhy || "알 수 없는 오류"}` +
            " · 버킷 정책(관리자 로그인)과 허용 형식을 먼저 확인해 주세요.",
        );
        return;
      }

      setUploadedCount(total);
      onChange(bundlePath, file.name);
    } catch {
      setError("업로드 중 오류가 발생했습니다.");
    } finally {
      setUploading(false);
      onBusyChange?.(false);
      setProgress(null);
      // 제거 후 같은 파일을 다시 골라도 change 이벤트가 뜨도록 매번 초기화한다.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  const handleRemove = () => {
    setError(null);
    setWarnings([]);
    setUploadedCount(null);
    onRemove();
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <p className="text-xs font-medium text-ink/45">
        업로드는 저장이 아닙니다 — 저장을 눌러야 반영됩니다.
      </p>

      {path ? (
        <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3">
          <FileArchive className="size-5 shrink-0 text-ink/45" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-ink">{fileName}</span>
            {uploadedCount != null && (
              <span className="text-xs font-medium text-ink/45">
                파일 {uploadedCount.toLocaleString()}개
              </span>
            )}
          </div>
          <button
            type="button"
            onClick={handleRemove}
            aria-label="상세 자료 제거"
            className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={uploading}
            className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
          >
            <FileArchive className="size-4" aria-hidden />
            {uploading ? "업로드 중…" : "zip · HTML 올리기"}
          </button>
          {uploading && progress && (
            <p className="text-xs font-medium text-ink/45" aria-live="polite">
              {progress.done} / {progress.total}
            </p>
          )}
        </div>
      )}

      {warnings.length > 0 && (
        <div role="alert" className="flex flex-col gap-1">
          {warnings.map((w, i) => (
            <p
              key={i}
              className="flex items-start gap-1.5 text-sm font-medium text-brand-yellow-ink"
            >
              <AlertTriangle className="mt-0.5 size-4 shrink-0" aria-hidden />
              {w}
            </p>
          ))}
        </div>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-red">
          {error}
        </p>
      )}

      <input
        ref={inputRef}
        type="file"
        accept=".zip,.html,.htm"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
