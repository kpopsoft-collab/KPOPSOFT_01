"use client";

import { Dialog as ModalPrimitive } from "@base-ui/react/dialog";
import { XIcon } from "lucide-react";

import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

/**
 * Centered modal — the counterpart to `ui/sheet.tsx` (a side drawer).
 *
 * Both wrap the same `@base-ui/react/dialog` primitive, so focus trapping,
 * Esc-to-close, backdrop click, scroll lock and `aria-modal` wiring come from
 * the primitive rather than hand-rolled effects.
 *
 * Mobile renders full-screen instead of a floating card: a tall modal on a
 * small viewport otherwise leaves an unusable sliver of backdrop and the
 * content scrolls awkwardly inside a rounded box.
 */
function Modal({ ...props }: ModalPrimitive.Root.Props) {
  return <ModalPrimitive.Root data-slot="modal" {...props} />;
}

function ModalTrigger({ ...props }: ModalPrimitive.Trigger.Props) {
  return <ModalPrimitive.Trigger data-slot="modal-trigger" {...props} />;
}

function ModalClose({ ...props }: ModalPrimitive.Close.Props) {
  return <ModalPrimitive.Close data-slot="modal-close" {...props} />;
}

function ModalOverlay({ className, ...props }: ModalPrimitive.Backdrop.Props) {
  return (
    <ModalPrimitive.Backdrop
      data-slot="modal-overlay"
      className={cn(
        "fixed inset-0 z-50 bg-ink/30 transition-opacity duration-150",
        "data-ending-style:opacity-0 data-starting-style:opacity-0",
        "supports-backdrop-filter:backdrop-blur-xs",
        className,
      )}
      {...props}
    />
  );
}

function ModalContent({
  className,
  children,
  showCloseButton = true,
  ...props
}: ModalPrimitive.Popup.Props & { showCloseButton?: boolean }) {
  return (
    <ModalPrimitive.Portal>
      <ModalOverlay />
      <ModalPrimitive.Popup
        data-slot="modal-content"
        className={cn(
          "fixed z-50 flex flex-col bg-ivory text-ink shadow-2xl transition duration-200 ease-out",
          "data-ending-style:opacity-0 data-starting-style:opacity-0",
          // Mobile: full screen.
          "inset-0 overflow-y-auto",
          // The native scrollbar is painted at the popup's right edge, where it
          // sticks out past the rounded corners and reads as a stray bar. Hide
          // it — wheel, touch, keyboard and drag scrolling all still work, and
          // the rounded card stays intact.
          "[scrollbar-width:none] [&::-webkit-scrollbar]:hidden",
          // Desktop: centered card with its own scroll area.
          "sm:inset-auto sm:top-1/2 sm:left-1/2 sm:max-h-[88vh] sm:w-[min(44rem,calc(100vw-3rem))] sm:-translate-x-1/2 sm:-translate-y-1/2 sm:rounded-[2rem]",
          "sm:data-ending-style:scale-95 sm:data-starting-style:scale-95",
          className,
        )}
        {...props}
      >
        {/* Close sits in a zero-height sticky strip rendered before the content,
            so it stays pinned to the top edge while the popup scrolls. Absolute
            positioning would scroll it out of reach — and on mobile, where the
            popup is full-screen with no backdrop to click, that leaves no way
            out but the Esc key. */}
        {showCloseButton && (
          <div className="sticky top-0 z-10 flex h-0 justify-end overflow-visible">
            <ModalPrimitive.Close
              data-slot="modal-close"
              render={
                <Button
                  variant="ghost"
                  className="mt-4 mr-4 size-11 bg-ivory/80 backdrop-blur-sm"
                  size="icon-sm"
                />
              }
            >
              <XIcon />
              <span className="sr-only">닫기</span>
            </ModalPrimitive.Close>
          </div>
        )}

        {children}
      </ModalPrimitive.Popup>
    </ModalPrimitive.Portal>
  );
}

function ModalTitle({ className, ...props }: ModalPrimitive.Title.Props) {
  return (
    <ModalPrimitive.Title
      data-slot="modal-title"
      className={cn(
        "text-2xl leading-tight font-extrabold tracking-tight text-ink md:text-3xl",
        className,
      )}
      {...props}
    />
  );
}

function ModalDescription({
  className,
  ...props
}: ModalPrimitive.Description.Props) {
  return (
    <ModalPrimitive.Description
      data-slot="modal-description"
      className={cn("text-body-lg text-ink/70", className)}
      {...props}
    />
  );
}

export {
  Modal,
  ModalClose,
  ModalContent,
  ModalDescription,
  ModalOverlay,
  ModalTitle,
  ModalTrigger,
};
