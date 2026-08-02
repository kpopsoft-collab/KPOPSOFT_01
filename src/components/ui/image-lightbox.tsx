"use client";

/**
 * Image lightbox — click-to-zoom modal for gallery-style images
 * (docs/99-archive/education-ver2/ §10 "이미지 확대").
 *
 * Built directly on the same `@base-ui/react/dialog` primitive `Sheet` wraps
 * (src/components/ui/sheet.tsx), just centered instead of docked to an edge.
 * The primitive's modal dialog already provides what §10/§31 ask for:
 * Escape to close, outside-press to close, and a focus trap — this file only
 * adds the KPOPSOFT visual treatment (rounded panel, caption, close button).
 */
import Image from "next/image";
import { Dialog as DialogPrimitive } from "@base-ui/react/dialog";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { useRef, useState, type TouchEvent } from "react";

import { cn } from "@/lib/utils";

function ImageLightbox({ ...props }: DialogPrimitive.Root.Props) {
  return <DialogPrimitive.Root data-slot="image-lightbox" {...props} />;
}

function ImageLightboxTrigger({ ...props }: DialogPrimitive.Trigger.Props) {
  return <DialogPrimitive.Trigger data-slot="image-lightbox-trigger" {...props} />;
}

export type ImageLightboxItem = {
  src: string;
  alt: string;
  caption?: string;
  unoptimized?: boolean;
};

function ImageLightboxContent({
  src,
  alt,
  caption,
  images,
  className,
}: {
  src: string;
  alt: string;
  caption?: string;
  images?: ImageLightboxItem[];
  className?: string;
}) {
  const slides = images?.length ? images : [{ src, alt, caption }];
  const [activeIndex, setActiveIndex] = useState(0);
  const touchStartX = useRef<number | null>(null);
  const activeSlide = slides[activeIndex] ?? slides[0];
  const hasMultipleImages = slides.length > 1;

  const move = (direction: -1 | 1) => {
    setActiveIndex((current) =>
      (current + direction + slides.length) % slides.length,
    );
  };

  const handleTouchStart = (event: TouchEvent<HTMLDivElement>) => {
    touchStartX.current = event.touches[0]?.clientX ?? null;
  };

  const handleTouchEnd = (event: TouchEvent<HTMLDivElement>) => {
    if (touchStartX.current === null) return;

    const endX = event.changedTouches[0]?.clientX;
    const distance = endX === undefined ? 0 : endX - touchStartX.current;
    touchStartX.current = null;

    if (Math.abs(distance) < 48) return;
    move(distance > 0 ? -1 : 1);
  };

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
        onKeyDown={(event) => {
          if (!hasMultipleImages) return;
          if (event.key === "ArrowLeft") {
            event.preventDefault();
            move(-1);
          }
          if (event.key === "ArrowRight") {
            event.preventDefault();
            move(1);
          }
        }}
        className={cn(
          "fixed top-1/2 left-1/2 z-50 flex max-h-[90vh] w-[calc(100%-2rem)] max-w-4xl -translate-x-1/2 -translate-y-1/2 flex-col overflow-hidden rounded-3xl bg-white outline-none transition-all duration-150",
          "data-ending-style:scale-95 data-ending-style:opacity-0 data-starting-style:scale-95 data-starting-style:opacity-0",
          className,
        )}
      >
        {/* 시각적으로는 숨기되 스크린 리더에는 모달의 목적을 알린다. */}
        <DialogPrimitive.Title className="sr-only">
          이미지 확대 보기
        </DialogPrimitive.Title>

        <div
          className="relative aspect-[4/3] w-full shrink-0 touch-pan-y overflow-hidden bg-ivory"
          role={hasMultipleImages ? "region" : undefined}
          aria-roledescription={hasMultipleImages ? "carousel" : undefined}
          aria-label={hasMultipleImages ? "교육 사례 이미지 갤러리" : undefined}
          onTouchStart={handleTouchStart}
          onTouchEnd={handleTouchEnd}
        >
          <div
            className="flex h-full transition-transform duration-300 ease-out"
            style={{ transform: `translateX(-${activeIndex * 100}%)` }}
          >
            {slides.map((slide, index) => (
              <div
                key={`${slide.src}-${index}`}
                className="relative h-full w-full shrink-0"
                aria-hidden={index !== activeIndex}
              >
                <Image
                  src={slide.src}
                  alt={index === activeIndex ? slide.alt : ""}
                  fill
                  unoptimized={slide.unoptimized}
                  sizes="(max-width: 768px) 94vw, 896px"
                  className="object-contain"
                />
              </div>
            ))}
          </div>

          {hasMultipleImages && (
            <>
              <span className="absolute top-4 left-4 rounded-full bg-ink/75 px-3 py-1.5 text-xs font-bold text-white backdrop-blur-sm">
                {activeIndex + 1} / {slides.length}
              </span>
              <button
                type="button"
                onClick={() => move(-1)}
                className="absolute top-1/2 left-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_-4px_rgba(41,37,34,0.35)] outline-none transition-colors hover:bg-ink hover:text-white focus-visible:ring-3 focus-visible:ring-brand-blue/40 sm:left-5"
                aria-label="이전 이미지"
              >
                <ChevronLeft className="size-6" aria-hidden />
              </button>
              <button
                type="button"
                onClick={() => move(1)}
                className="absolute top-1/2 right-3 inline-flex size-11 -translate-y-1/2 items-center justify-center rounded-full bg-white/90 text-ink shadow-[0_4px_16px_-4px_rgba(41,37,34,0.35)] outline-none transition-colors hover:bg-ink hover:text-white focus-visible:ring-3 focus-visible:ring-brand-blue/40 sm:right-5"
                aria-label="다음 이미지"
              >
                <ChevronRight className="size-6" aria-hidden />
              </button>
            </>
          )}
        </div>

        {(activeSlide.caption || hasMultipleImages) && (
          <div className="flex min-h-16 items-center justify-between gap-5 border-t border-ink/10 px-5 py-3 sm:px-6">
            <DialogPrimitive.Description
              className="min-w-0 text-sm font-medium text-ink/70"
              aria-live="polite"
            >
              {activeSlide.caption}
            </DialogPrimitive.Description>

            {hasMultipleImages && (
              <div className="flex shrink-0 items-center gap-2" aria-label="이미지 선택">
                {slides.map((slide, index) => (
                  <button
                    key={`${slide.src}-dot`}
                    type="button"
                    onClick={() => setActiveIndex(index)}
                    className={cn(
                      "size-2.5 rounded-full outline-none transition-all focus-visible:ring-3 focus-visible:ring-brand-blue/40",
                      index === activeIndex
                        ? "w-6 bg-brand-blue"
                        : "bg-ink/20 hover:bg-ink/40",
                    )}
                    aria-label={`${index + 1}번째 이미지 보기`}
                    aria-current={index === activeIndex ? "true" : undefined}
                  />
                ))}
              </div>
            )}
          </div>
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
