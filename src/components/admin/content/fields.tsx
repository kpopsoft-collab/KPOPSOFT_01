"use client";

import { X, Plus } from "lucide-react";

import { cn } from "@/lib/utils";

/** Shared admin form field primitives — one visual language across all CMS forms. */

const inputClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white";

const labelClass = "flex flex-col gap-2 text-sm font-semibold text-ink/70";

export function TextField({
  label,
  value,
  onChange,
  placeholder,
  required,
  name,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  required?: boolean;
  name?: string;
}) {
  return (
    <label className={labelClass}>
      {label}
      {required && <span className="sr-only">(필수)</span>}
      <input
        name={name}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className={inputClass}
      />
    </label>
  );
}

export function NumberField({
  label,
  value,
  onChange,
}: {
  label: string;
  value: number;
  onChange: (v: number) => void;
}) {
  return (
    <label className={labelClass}>
      {label}
      <input
        type="number"
        value={Number.isFinite(value) ? value : 0}
        onChange={(e) => onChange(Number(e.target.value))}
        className={inputClass}
      />
    </label>
  );
}

export function TextAreaField({
  label,
  value,
  onChange,
  placeholder,
  rows = 4,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  rows?: number;
}) {
  return (
    <label className={labelClass}>
      {label}
      <textarea
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        rows={rows}
        className={cn(inputClass, "h-auto resize-y py-3 leading-relaxed")}
      />
    </label>
  );
}

export function CheckboxField({
  label,
  checked,
  onChange,
}: {
  label: string;
  checked: boolean;
  onChange: (v: boolean) => void;
}) {
  return (
    <label className="flex cursor-pointer items-center gap-3 text-sm font-semibold text-ink/80">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="size-5 accent-brand-blue"
      />
      {label}
    </label>
  );
}

/**
 * Editor for an ordered list of strings (results / body paragraphs / tags).
 * Add, edit, and remove entries.
 */
export function StringListField({
  label,
  values,
  onChange,
  placeholder,
  multiline,
  addLabel = "항목 추가",
}: {
  label: string;
  values: string[];
  onChange: (v: string[]) => void;
  placeholder?: string;
  multiline?: boolean;
  addLabel?: string;
}) {
  const setAt = (i: number, v: string) =>
    onChange(values.map((val, idx) => (idx === i ? v : val)));
  const removeAt = (i: number) => onChange(values.filter((_, idx) => idx !== i));
  const add = () => onChange([...values, ""]);

  return (
    <div className="flex flex-col gap-2">
      <span className="text-sm font-semibold text-ink/70">{label}</span>
      <div className="flex flex-col gap-2">
        {values.map((val, i) => (
          <div key={i} className="flex items-start gap-2">
            {multiline ? (
              <textarea
                value={val}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder={placeholder}
                rows={2}
                className={cn(inputClass, "h-auto resize-y py-2.5")}
              />
            ) : (
              <input
                value={val}
                onChange={(e) => setAt(i, e.target.value)}
                placeholder={placeholder}
                className={inputClass}
              />
            )}
            <button
              type="button"
              onClick={() => removeAt(i)}
              aria-label={`${i + 1}번째 항목 삭제`}
              className="mt-1 inline-flex size-10 shrink-0 items-center justify-center rounded-xl border border-ink/15 text-ink/60 transition-colors hover:border-brand-red hover:text-brand-red"
            >
              <X className="size-4" aria-hidden />
            </button>
          </div>
        ))}
      </div>
      <button
        type="button"
        onClick={add}
        className="inline-flex min-h-9 w-fit items-center gap-1.5 rounded-full border border-ink/15 px-4 text-sm font-semibold text-ink/70 transition-colors hover:border-brand-blue hover:text-brand-blue"
      >
        <Plus className="size-4" aria-hidden />
        {addLabel}
      </button>
    </div>
  );
}
