"use client";

import { useState, useTransition } from "react";
import Image from "next/image";
import { Trash2 } from "lucide-react";

import type { EducationPastProgramImage } from "@/lib/admin/content-types";
import { TextField } from "@/components/admin/content/fields";
import { ImageUpload } from "@/components/admin/content/image-upload";

/**
 * 지난 프로그램 갤러리 — 대표 이미지 뒤에 이어지는 현장·결과물 사진.
 *
 * 카드 배지 숫자는 따로 입력하지 않는다. 대표 1장 + 여기 등록된 수로 화면이
 * 계산하므로, 숫자를 손으로 적어 두면 사진을 지운 뒤에도 옛 숫자가 남는다.
 */
export function GalleryManager({
  programId,
  images,
  onAdd,
  onRemove,
}: {
  programId: string;
  images: EducationPastProgramImage[];
  onAdd: (input: {
    programId: string;
    imageUrl: string;
    alt: string;
    caption: string;
    sortOrder: number;
  }) => Promise<void>;
  onRemove: (id: string) => Promise<void>;
}) {
  const [imageUrl, setImageUrl] = useState<string | undefined>();
  const [alt, setAlt] = useState("");
  const [caption, setCaption] = useState("");
  const [pending, start] = useTransition();

  const add = () => {
    if (!imageUrl) return;
    start(async () => {
      await onAdd({
        programId,
        imageUrl,
        alt: alt.trim(),
        caption: caption.trim(),
        sortOrder: images.length,
      });
      setImageUrl(undefined);
      setAlt("");
      setCaption("");
    });
  };

  return (
    <section className="flex flex-col gap-5 rounded-3xl border border-border bg-card p-6">
      <div>
        <h2 className="font-extrabold tracking-tight text-ink">갤러리 이미지</h2>
        <p className="mt-1 text-sm text-ink/55">
          대표 이미지 포함 총 {images.length + 1}장이 카드 배지에 표시됩니다.
        </p>
      </div>

      {images.length > 0 && (
        <ul className="flex flex-col gap-3">
          {images.map((image) => (
            <li
              key={image.id}
              className="flex items-center gap-4 rounded-2xl border border-ink/10 p-3"
            >
              <div className="relative size-16 shrink-0 overflow-hidden rounded-xl bg-ink/5">
                <Image src={image.imageUrl} alt={image.alt} fill className="object-cover" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="truncate text-sm font-semibold text-ink">
                  {image.caption || "(캡션 없음)"}
                </p>
                <p className="truncate text-xs text-ink/50">{image.alt || "(대체 텍스트 없음)"}</p>
              </div>
              <button
                type="button"
                onClick={() => start(() => onRemove(image.id))}
                disabled={pending}
                aria-label="이미지 삭제"
                className="inline-flex size-11 items-center justify-center rounded-full text-ink/50 transition-colors hover:bg-brand-red/10 hover:text-brand-red disabled:opacity-50"
              >
                <Trash2 className="size-4" aria-hidden />
              </button>
            </li>
          ))}
        </ul>
      )}

      <div className="flex flex-col gap-4 border-t border-ink/10 pt-5">
        <ImageUpload
          value={imageUrl}
          onChange={setImageUrl}
          bucket="education"
          label="이미지 추가"
        />
        <div className="grid gap-4 sm:grid-cols-2">
          <TextField label="대체 텍스트" value={alt} onChange={setAlt} />
          <TextField label="캡션" value={caption} onChange={setCaption} />
        </div>
        <button
          type="button"
          onClick={add}
          disabled={!imageUrl || pending}
          className="inline-flex min-h-11 w-fit items-center rounded-full border border-ink/15 px-5 font-semibold text-ink/70 transition-colors hover:bg-ink/5 disabled:opacity-50"
        >
          {pending ? "추가 중…" : "갤러리에 추가"}
        </button>
      </div>
    </section>
  );
}
