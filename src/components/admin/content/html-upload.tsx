"use client";

import { useRef, useState } from "react";
import { FileText, X } from "lucide-react";

/**
 * 상세 페이지 HTML 업로드 위젯 (백로그 01 §3 4단계).
 *
 * Storage 왕복 없이 파일을 읽어 브라우저에서 바로 UTF-8 텍스트로 디코드하고,
 * 원본(raw)과 파일명을 `onChange`로 올린다. 실제 정제(sanitize)는 서버 액션에서
 * 한다 — 여기서는 크기·확장자·인코딩만 걸러 명백히 잘못된 파일을 막는다.
 * 미리보기는 만들지 않는다(D9 — sandbox iframe이 실제 결과와 달라질 수 있어 v1 생략).
 */
const MAX_BYTES = 512 * 1024;

export function HtmlUpload({
  value,
  fileName,
  onChange,
  onRemove,
  label = "상세 페이지 HTML",
}: {
  /** 업로드된 원본 HTML 텍스트(detailHtmlRaw). */
  value: string;
  /** 업로드된 파일명(detailHtmlName). */
  fileName: string;
  onChange: (raw: string, fileName: string) => void;
  onRemove: () => void;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = async (file: File | undefined) => {
    setError(null);
    if (!file) return;

    // 확장자만 본다. .html의 MIME은 OS·브라우저에 따라 ""나 application/octet-stream
    // 처럼 제각각이라, MIME까지 통과 조건으로 걸면 멀쩡한 파일이 거부된다.
    // 여기 검사는 실수를 걸러 주는 용도다 — 클라이언트 검사는 어차피 우회되므로
    // 진짜 방어선은 서버 액션의 크기 검사와 정제다.
    if (!/\.html?$/i.test(file.name)) {
      setError("HTML 파일(.html)만 올릴 수 있어요.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }
    if (file.size > MAX_BYTES) {
      setError("HTML 파일은 512KB 이하여야 해요.");
      if (inputRef.current) inputRef.current.value = "";
      return;
    }

    try {
      const buffer = await file.arrayBuffer();
      // CP949/EUC-KR 등 다른 인코딩으로 저장된 파일이 깨진 채 들어오는 것을 막는다.
      const raw = new TextDecoder("utf-8", { fatal: true }).decode(buffer);
      onChange(raw, file.name);
    } catch {
      setError("UTF-8로 저장된 HTML만 올릴 수 있어요.");
    } finally {
      // 제거 후 같은 파일을 다시 골라도 change 이벤트가 뜨도록 매번 초기화한다.
      if (inputRef.current) inputRef.current.value = "";
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink/70">{label}</span>

      {value ? (
        <div className="flex items-center gap-3 rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3">
          <FileText className="size-5 shrink-0 text-ink/45" aria-hidden />
          <div className="flex min-w-0 flex-col">
            <span className="truncate text-sm font-medium text-ink">{fileName}</span>
            <span className="text-xs font-medium text-ink/45">
              {value.length.toLocaleString()}자
            </span>
          </div>
          <button
            type="button"
            onClick={() => {
              setError(null); // 지운 파일의 에러 문구가 남아 있으면 무엇을 고쳐야 할지 헷갈린다
              onRemove();
            }}
            aria-label="상세 페이지 HTML 제거"
            className="ml-auto inline-flex size-11 shrink-0 items-center justify-center rounded-full text-ink/60 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
          >
            <X className="size-4" aria-hidden />
          </button>
        </div>
      ) : (
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          className="inline-flex min-h-11 w-fit items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue"
        >
          <FileText className="size-4" aria-hidden />
          HTML 파일 올리기
        </button>
      )}

      {error && (
        <p role="alert" className="text-sm font-medium text-brand-red">
          {error}
        </p>
      )}

      <p className="text-xs font-medium text-ink/45">
        파일이 여러 개면 아래 상세 번들(zip)을 쓰세요.
      </p>

      <input
        ref={inputRef}
        type="file"
        accept=".html,.htm,text/html"
        className="sr-only"
        onChange={(e) => handleFile(e.target.files?.[0])}
      />
    </div>
  );
}
