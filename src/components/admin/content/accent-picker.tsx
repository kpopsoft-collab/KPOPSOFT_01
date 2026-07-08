"use client";

import { accentBg, type Accent } from "@/lib/site";
import { ACCENTS } from "@/lib/admin/content-types";
import { cn } from "@/lib/utils";

/**
 * Brand-accent swatch picker (docs §6 — accent 선택 색상 팔레트 버튼).
 * Controlled: pass `value` + `onChange`. Also renders a hidden input named
 * `name` so it submits inside a server-action <form>.
 */
export function AccentPicker({
  value,
  onChange,
  name = "accent",
}: {
  value: Accent;
  onChange: (accent: Accent) => void;
  name?: string;
}) {
  return (
    <div>
      <div className="flex flex-wrap gap-2" role="radiogroup" aria-label="색상">
        {ACCENTS.map((accent) => (
          <button
            key={accent}
            type="button"
            role="radio"
            aria-checked={value === accent}
            aria-label={accent}
            onClick={() => onChange(accent)}
            className={cn(
              "size-9 rounded-full ring-offset-2 ring-offset-ivory transition-transform focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-brand-blue",
              accentBg[accent],
              value === accent
                ? "scale-110 ring-2 ring-ink"
                : "opacity-80 hover:opacity-100",
            )}
          />
        ))}
      </div>
      <input type="hidden" name={name} value={value} />
    </div>
  );
}
