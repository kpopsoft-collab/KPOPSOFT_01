"use client";

import { useRef, useState } from "react";
import { ImagePlus, X } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Image upload widget (docs §4.2, §11.8 — 강사/Work/Insights 커버, 공통 재사용).
 *
 * MOCK MODE: reads the chosen file as a data: URL client-side and reports it via
 * `onChange` — no Storage yet, so the data URL IS the stored value and previews
 * work end-to-end. On wiring day this posts the file to Supabase Storage and
 * reports the returned path instead; the parent form and field stay the same.
 * Renders a hidden input named `name` so the value submits with a server action.
 */
const ACCEPTED = ["image/jpeg", "image/png", "image/webp"];
const MAX_BYTES = 5 * 1024 * 1024;

export function ImageUpload({
  value,
  onChange,
  name = "imageUrl",
  label = "이미지",
}: {
  value?: string;
  onChange: (url: string | undefined) => void;
  name?: string;
  label?: string;
}) {
  const inputRef = useRef<HTMLInputElement>(null);
  const [error, setError] = useState<string | null>(null);

  const handleFile = (file: File | undefined) => {
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
    const reader = new FileReader();
    reader.onload = () => onChange(reader.result as string);
    reader.readAsDataURL(file);
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
            className="inline-flex min-h-9 items-center gap-2 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/80 transition-colors hover:border-brand-blue hover:text-brand-blue"
          >
            <ImagePlus className="size-4" aria-hidden />
            {value ? "이미지 변경" : "이미지 올리기"}
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
