"use client";

import Image from "next/image";
import { ArrowLeft, ArrowRight, Trash2 } from "lucide-react";

import { ImageUpload } from "@/components/admin/content/image-upload";

/**
 * 상세 시트 갤러리 — 커버 뒤에 이어지는 화면들(`work_items.image_urls`).
 *
 * 순서가 곧 보여지는 순서라 좌우 이동 버튼을 둔다. 업로드 칸은 항상 목록
 * 아래에 하나만 두고, 고르면 목록 끝에 붙인다 — 빈 슬롯을 미리 여러 개
 * 만들어 두면 어디까지가 실제 이미지인지 알기 어렵다.
 */
export function GalleryField({
  values,
  onChange,
}: {
  values: string[];
  onChange: (next: string[]) => void;
}) {
  const move = (index: number, delta: number) => {
    const next = [...values];
    const target = index + delta;
    if (target < 0 || target >= next.length) return;
    [next[index], next[target]] = [next[target], next[index]];
    onChange(next);
  };

  return (
    <div className="flex flex-col gap-3">
      <span className="text-sm font-semibold text-ink/70">
        갤러리 이미지 ({values.length}장)
      </span>

      {values.length > 0 && (
        <ul className="flex flex-col gap-2">
          {values.map((url, index) => (
            <li
              key={`${url}-${index}`}
              className="flex items-center gap-3 rounded-2xl border border-ink/10 p-2"
            >
              <div className="relative size-14 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                <Image src={url} alt="" fill className="object-cover" />
              </div>
              <p className="min-w-0 flex-1 truncate text-xs text-ink/50">{url}</p>
              <button
                type="button"
                onClick={() => move(index, -1)}
                disabled={index === 0}
                aria-label="앞으로"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <ArrowLeft className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(index, 1)}
                disabled={index === values.length - 1}
                aria-label="뒤로"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-ink/5 hover:text-ink disabled:opacity-30"
              >
                <ArrowRight className="size-4" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => onChange(values.filter((_, i) => i !== index))}
                aria-label="삭제"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-brand-red/10 hover:text-brand-red"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <ImageUpload
        value={undefined}
        onChange={(url) => {
          if (url) onChange([...values, url]);
        }}
        bucket="work"
        label="갤러리에 이미지 추가"
      />
    </div>
  );
}
