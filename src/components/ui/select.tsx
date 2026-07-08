"use client";

import { Select as SelectPrimitive } from "@base-ui/react/select";
import { Check, ChevronDown } from "lucide-react";

import { cn } from "@/lib/utils";

/**
 * Brand-styled wrapper over base-ui Select (docs/디자인.md — flat color, hairline
 * borders, no gradients). Trigger matches the form's text inputs (h-12,
 * rounded-2xl, ivory field), the popup is a white rounded panel. Keyboard
 * navigation / focus management come from the primitive.
 */
function Select(props: SelectPrimitive.Root.Props<string>) {
  return <SelectPrimitive.Root {...props} />;
}

function SelectTrigger({
  className,
  children,
  ...props
}: SelectPrimitive.Trigger.Props) {
  return (
    <SelectPrimitive.Trigger
      data-slot="select-trigger"
      className={cn(
        "flex h-12 w-full items-center justify-between gap-2 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors",
        "hover:border-ink/35 data-[popup-open]:border-brand-blue data-[popup-open]:bg-white",
        "focus-visible:border-brand-blue focus-visible:ring-3 focus-visible:ring-brand-blue/30",
        className,
      )}
      {...props}
    >
      {children}
      <SelectPrimitive.Icon className="text-ink/45 transition-transform data-[popup-open]:rotate-180">
        <ChevronDown className="size-4.5" aria-hidden />
      </SelectPrimitive.Icon>
    </SelectPrimitive.Trigger>
  );
}

function SelectValue(props: SelectPrimitive.Value.Props) {
  return <SelectPrimitive.Value data-slot="select-value" {...props} />;
}

function SelectContent({
  className,
  children,
  ...props
}: SelectPrimitive.Popup.Props) {
  return (
    <SelectPrimitive.Portal>
      <SelectPrimitive.Positioner sideOffset={8} className="z-50 outline-none">
        <SelectPrimitive.Popup
          data-slot="select-content"
          className={cn(
            "max-h-72 w-[var(--anchor-width)] origin-[var(--transform-origin)] overflow-y-auto rounded-2xl border border-ink/10 bg-white p-1.5 shadow-[0_12px_32px_-12px_rgba(41,37,34,0.28)]",
            "transition-[transform,opacity] data-[ending-style]:opacity-0 data-[starting-style]:opacity-0",
            className,
          )}
          {...props}
        >
          {children}
        </SelectPrimitive.Popup>
      </SelectPrimitive.Positioner>
    </SelectPrimitive.Portal>
  );
}

function SelectItem({
  className,
  children,
  ...props
}: SelectPrimitive.Item.Props) {
  return (
    <SelectPrimitive.Item
      data-slot="select-item"
      className={cn(
        "flex cursor-pointer items-center justify-between gap-2 rounded-xl px-3 py-2.5 text-[0.95rem] font-semibold text-ink/70 outline-none transition-colors select-none",
        "data-[highlighted]:bg-ink/5 data-[selected]:bg-brand-blue/10 data-[selected]:text-brand-blue",
        className,
      )}
      {...props}
    >
      <SelectPrimitive.ItemText>{children}</SelectPrimitive.ItemText>
      <SelectPrimitive.ItemIndicator>
        <Check className="size-4 text-brand-blue" aria-hidden />
      </SelectPrimitive.ItemIndicator>
    </SelectPrimitive.Item>
  );
}

export { Select, SelectTrigger, SelectValue, SelectContent, SelectItem };
