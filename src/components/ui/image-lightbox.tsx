"use client";

/**
 * Image lightbox — click-to-zoom modal for gallery-style images
 * (docs/KPOPSOFT_Education_Page_ver2.md §10 "이미지 확대").
 *
 * Built directly on the same `@base-ui/react/dialog` primitive `Sheet` wraps
 * (src/components/ui/sheet.tsx), just centered instead of docked to an edge.
 * The primitive's modal dialog already provides what §10/§31 ask for:
 * Escape to close, outside-press to close, and a focus trap — this file only
 * adds the KPOPSOFT visual treatment (rounded panel, caption, close button).
 */
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { X } from "lucide-react";

import { cn } from "@/lib/utils";

function ImageLightbox({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="image-lightbox" {...props} />;
}

function ImageLightboxTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="image-lightbox-trigger" {...props} />;
}

function ImageLightboxContent({
  src,
  alt,
  caption,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  className?: string;
}) {
  return (
    <DialogPrimitive.Portal>
      <DialogPrimitive.Backdrop
        className={cn(
          "fixed inset-0 z-50 bg-ink/70 transition-opacity duration-150",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
        )}
      />
      <DialogPrimitive.Popup
        data-slot="image-lightbox-content"
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[88vh] w-[calc(100%-2.5rem)] max-w-3xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white outline-none transition-all duration-150",
          "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className,
        )}
      >
        {/* 시각적으로는 숨기되 스크린 리더에는 모달의 목적을 알린다. */}
        <DialogPrimitive.Title className="sr-only">
          이미지 확대 보기
        </DialogPrimitive.Title>

        <div className="relative aspect-[4/3] w-full shrink-0 bg-ink/5">
          <Image
            src={src}
            alt={alt}
            fill
            sizes="(max-width: 768px) 90vw, 768px"
            className="object-cover"
          />
        </div>

        {caption && (
          <DialogPrimitive.Description className="border-t border-ink/10 px-6 py-4 text-sm font-medium text-ink/70">
            {caption}
          </DialogPrimitive.Description>
        )}

        <DialogPrimitive.Close
          className="absolute top-4 right-4 inline-flex size-11 items-center justify-center rounded-full bg-white text-ink shadow-[0_4px_16px_-4px_rgba(41,37,34,0.35)] outline-none transition-colors hover:bg-ink hover:text-ivory focus-visible:ring-3 focus-visible:ring-brand-blue/40"
          aria-label="닫기"
        >
          <X className="size-5" aria-hidden />
        </DialogPrimitive.Close>
      </DialogPrimitive.Popup>
    </DialogPrimitive.Portal>
  );
}

export { ImageLightbox, ImageLightboxTrigger, ImageLightboxContent };
