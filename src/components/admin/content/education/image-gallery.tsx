"use client";

import { useState, useTransition } from "react";
import { Trash2 } from "lucide-react";

import type {
  EducationImage,
  EducationImageOwner,
  EducationImageRole,
} from "@/lib/admin/content-types";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { CheckboxField, NumberField, TextField } from "@/components/admin/content/fields";
import { cn } from "@/lib/utils";

const selectClass =
  "h-11 w-full rounded-xl border border-ink/15 bg-ivory/60 px-3 text-sm font-medium text-ink outline-none transition-colors focus:border-brand-blue focus:bg-white";

/**
 * Shared image-gallery editor for programs/outputs/cases (Education §24).
 * Every image row carries isPublic/isBlurred/isFeatured/displayOrder/altText/
 * caption — the same metadata regardless of which entity owns it, which is why
 * a single component (backed by the polymorphic `education_images` table)
 * covers every gallery on the Education admin instead of three near-identical
 * ones. `roleOptions` narrows which gallery role(s) this instance manages
 * (e.g. a case shows 현장/결과물/상세 갤러리 as three role tabs' worth of rows
 * in one list, a program's output gallery only ever writes role="output").
 */
export function EducationImageGallery({
  ownerType,
  ownerId,
  roleOptions,
  initialImages,
  addAction,
  updateAction,
  removeAction,
}: {
  ownerType: EducationImageOwner;
  ownerId: string;
  roleOptions: { value: EducationImageRole; label: string }[];
  initialImages: EducationImage[];
  addAction: (input: {
    ownerType: EducationImageOwner;
    ownerId: string;
    role: EducationImageRole;
    imageUrl: string;
    altText: string;
    caption?: string;
    isPublic: boolean;
    isBlurred: boolean;
    isFeatured: boolean;
    displayOrder: number;
  }) => Promise<EducationImage>;
  updateAction: (id: string, patch: Partial<EducationImage>) => Promise<void>;
  removeAction: (id: string) => Promise<void>;
}) {
  const [images, setImages] = useState(initialImages);
  const [newRole, setNewRole] = useState<EducationImageRole>(roleOptions[0]?.value ?? "gallery");
  const [pending, start] = useTransition();

  const handleAdd = (url: string | undefined) => {
    if (!url) return;
    start(async () => {
      const nextOrder = images.reduce((m, i) => Math.max(m, i.displayOrder), -1) + 1;
      const input = {
        ownerType,
        ownerId,
        role: newRole,
        imageUrl: url,
        altText: "",
        isPublic: true,
        isBlurred: false,
        isFeatured: false,
        displayOrder: nextOrder,
      };
      const created = await addAction(input);
      setImages((prev) => [...prev, created]);
    });
  };

  return (
    <div className="flex flex-col gap-4">
      {roleOptions.length > 1 && (
        <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
          새 이미지 역할
          <select
            value={newRole}
            onChange={(e) => setNewRole(e.target.value as EducationImageRole)}
            className={selectClass}
          >
            {roleOptions.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>
        </label>
      )}

      <ImageUpload
        value={undefined}
        onChange={handleAdd}
        bucket="education"
        label="이미지 추가"
      />

      {images.length === 0 ? (
        <p className="rounded-xl border border-dashed border-ink/15 p-6 text-center text-sm text-ink/45">
          등록된 이미지가 없습니다.
        </p>
      ) : (
        <ul className="flex flex-col gap-3">
          {images.map((img) => (
            <GalleryRow
              key={img.id}
              image={img}
              roleOptions={roleOptions}
              pending={pending}
              onUpdate={(patch) =>
                start(async () => {
                  await updateAction(img.id, patch);
                  setImages((prev) =>
                    prev.map((i) => (i.id === img.id ? { ...i, ...patch } : i)),
                  );
                })
              }
              onRemove={() =>
                start(async () => {
                  await removeAction(img.id);
                  setImages((prev) => prev.filter((i) => i.id !== img.id));
                })
              }
            />
          ))}
        </ul>
      )}
    </div>
  );
}

function GalleryRow({
  image,
  roleOptions,
  pending,
  onUpdate,
  onRemove,
}: {
  image: EducationImage;
  roleOptions: { value: EducationImageRole; label: string }[];
  pending: boolean;
  onUpdate: (patch: Partial<EducationImage>) => void;
  onRemove: () => void;
}) {
  const [altText, setAltText] = useState(image.altText);
  const [caption, setCaption] = useState(image.caption ?? "");
  const [role, setRole] = useState<EducationImageRole>(image.role);
  const [isPublic, setIsPublic] = useState(image.isPublic);
  const [isBlurred, setIsBlurred] = useState(image.isBlurred);
  const [isFeatured, setIsFeatured] = useState(image.isFeatured);
  const [displayOrder, setDisplayOrder] = useState(image.displayOrder);

  const dirty =
    altText !== image.altText ||
    caption !== (image.caption ?? "") ||
    role !== image.role ||
    isPublic !== image.isPublic ||
    isBlurred !== image.isBlurred ||
    isFeatured !== image.isFeatured ||
    displayOrder !== image.displayOrder;

  return (
    <li className="flex flex-col gap-3 rounded-2xl border border-border bg-card p-4 sm:flex-row">
      <div
        className={cn(
          "size-24 shrink-0 overflow-hidden rounded-xl bg-ivory/60",
          !image.isPublic && "opacity-50",
        )}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.imageUrl}
          alt=""
          className={cn("size-full object-cover", image.isBlurred && "blur-sm")}
        />
      </div>

      <div className="flex flex-1 flex-col gap-3">
        <div className="grid gap-3 sm:grid-cols-2">
          <TextField label="대체 텍스트 (alt)" value={altText} onChange={setAltText} required />
          <TextField label="캡션" value={caption} onChange={setCaption} />
        </div>

        <div className="grid gap-3 sm:grid-cols-2">
          {roleOptions.length > 1 && (
            <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
              역할
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as EducationImageRole)}
                className={selectClass}
              >
                {roleOptions.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          )}
          <NumberField label="노출 순서" value={displayOrder} onChange={setDisplayOrder} />
        </div>

        <div className="flex flex-wrap items-center gap-4">
          <CheckboxField label="공개" checked={isPublic} onChange={setIsPublic} />
          <CheckboxField label="Blur 처리" checked={isBlurred} onChange={setIsBlurred} />
          <CheckboxField label="대표 이미지" checked={isFeatured} onChange={setIsFeatured} />
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            disabled={pending || !dirty}
            onClick={() =>
              onUpdate({ altText, caption: caption || undefined, role, isPublic, isBlurred, isFeatured, displayOrder })
            }
            className="inline-flex min-h-9 items-center rounded-full bg-brand-blue px-4 text-sm font-semibold text-white transition-colors hover:bg-brand-navy disabled:opacity-40"
          >
            변경 저장
          </button>
          <button
            type="button"
            disabled={pending}
            onClick={onRemove}
            aria-label="이미지 삭제"
            className="inline-flex size-9 items-center justify-center rounded-lg border border-ink/15 text-ink/70 transition-colors hover:border-brand-red hover:text-brand-red disabled:opacity-50"
          >
            <Trash2 className="size-4" aria-hidden />
          </button>
        </div>
      </div>
    </li>
  );
}
