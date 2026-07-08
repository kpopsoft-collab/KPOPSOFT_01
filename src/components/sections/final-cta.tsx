"use client";

import {
  type FormEvent,
  useEffect,
  useLayoutEffect,
  useRef,
  useState,
  useTransition,
} from "react";
import { useSearchParams } from "next/navigation";
import { Check, Send } from "lucide-react";

import { Section } from "@/components/layout/section";
import { Eyebrow } from "@/components/ui/eyebrow";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Ring, Star } from "@/components/shapes";
import { submitInquiry } from "@/lib/inquiry-actions";
import { inquiryOptions, sectionId, type InquiryType } from "@/lib/site";
import { cn } from "@/lib/utils";

/** 문의 유형/세부 유형은 site.ts의 inquiryOptions(어드민 관리 예정 단일 소스)에서 온다. */
const defaultOption = inquiryOptions[0];

function optionFor(type: InquiryType) {
  return inquiryOptions.find((option) => option.type === type) ?? defaultOption;
}

function subtypesFor(type: InquiryType) {
  return optionFor(type).subtypes;
}

/** 유형/세부 유형 미선택 시(폼 진입 직후) 보여줄 중립 예시. */
const NEUTRAL_PLACEHOLDER = "문의하실 내용을 자유롭게 적어 주세요.";

/** 선택된 세부 유형(label)에 맞는 문의 내용 예시. 미선택이면 중립 문구. */
function placeholderFor(type: InquiryType | "", subtype: string): string {
  if (!type || !subtype) return NEUTRAL_PLACEHOLDER;
  const matched = subtypesFor(type).find((item) => item.label === subtype);
  return matched?.placeholder ?? NEUTRAL_PLACEHOLDER;
}

/** 칩이 이 줄 수를 넘겨 접히면 드롭다운으로 전환한다. */
const MAX_CHIP_ROWS = 1;
const chipBase =
  "flex min-h-11 items-center rounded-full border px-4 text-sm font-semibold transition-colors";

/** 측정→모드 전환을 페인트 전에 처리해 칩↔드롭다운 깜빡임을 없앤다. */
const useIsoLayoutEffect =
  typeof window !== "undefined" ? useLayoutEffect : useEffect;

/**
 * 세부 유형 선택. 항목이 적어 칩이 MAX_CHIP_ROWS 줄 안에 들어가면 칩으로,
 * 그 이상 접히면(교육/AI 솔루션처럼 항목이 많거나 화면이 좁을 때) 드롭다운으로
 * 자동 전환한다. 숨긴 측정용 칩 레이아웃의 실제 줄 수(offsetTop 그룹)를 재서 판단하고,
 * 화면 크기 변화·항목 변경에 반응한다.
 */
function SubtypeField({
  subtypes,
  value,
  onChange,
}: {
  subtypes: readonly string[];
  value: string;
  onChange: (next: string) => void;
}) {
  const measureRef = useRef<HTMLDivElement>(null);
  // SSR/최초 렌더 추정값 — 측정 전까지 레이아웃 교정을 최소화한다.
  const [asDropdown, setAsDropdown] = useState(subtypes.length > 5);

  useIsoLayoutEffect(() => {
    const el = measureRef.current;
    if (!el) return;
    const measure = () => {
      const rows = new Set<number>();
      for (const child of el.children) {
        rows.add((child as HTMLElement).offsetTop);
      }
      setAsDropdown(rows.size > MAX_CHIP_ROWS);
    };
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(el);
    return () => observer.disconnect();
  }, [subtypes]);

  return (
    <fieldset className="relative mt-5 flex flex-col gap-2 text-sm font-semibold text-ink/70">
      <legend className="mb-2">세부 유형</legend>

      {/* 줄 수 측정 전용 — 실제 칩과 동일한 폭/여백으로 숨겨서 렌더. */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute inset-x-0 flex flex-wrap gap-2"
      >
        {subtypes.map((item) => (
          <span key={item} className={chipBase}>
            {item}
          </span>
        ))}
      </div>

      {asDropdown ? (
        <Select
          // base-ui는 미선택 센티넬로 null을 쓴다("" 은 값으로 취급돼 첫 항목이 잡힘).
          value={value || null}
          onValueChange={(next: string | null) => next && onChange(next)}
        >
          <SelectTrigger aria-label="세부 유형">
            <SelectValue>
              {(selected) =>
                selected ? (
                  (selected as string)
                ) : (
                  <span className="text-ink/40">선택해주세요</span>
                )
              }
            </SelectValue>
          </SelectTrigger>
          <SelectContent>
            {subtypes.map((item) => (
              <SelectItem key={item} value={item}>
                {item}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      ) : (
        <div className="flex flex-wrap gap-2">
          {subtypes.map((item) => (
            <label
              key={item}
              className={cn(
                chipBase,
                "cursor-pointer",
                value === item
                  ? "border-brand-blue bg-brand-blue/10 text-brand-blue"
                  : "border-ink/15 text-ink/60 hover:border-ink/35",
              )}
            >
              <input
                type="radio"
                name="inquirySubtype"
                value={item}
                checked={value === item}
                onChange={() => onChange(item)}
                className="sr-only"
              />
              {item}
            </label>
          ))}
        </div>
      )}
    </fieldset>
  );
}

/**
 * Final CTA (docs/디자인.md §8 "FINAL CTA", docs/기획서.md §4 headline).
 *
 * Where the Hero splits headline-left / shapes-right, and B2bEducation boxes
 * its message inside a dark rounded panel, this is the site's last editorial
 * "poster" beat: a centered, near-full-viewport statement with brand shapes
 * bleeding off every edge. Most shapes sit at low opacity as poster texture;
 * the single filled Star is the section's one saturated accent moment. The
 * Footer directly below repeats the tagline in a small, bottom-aligned,
 * dark-panel treatment — this section is the large graphic statement that
 * precedes it, not a restatement of it.
 */
export function FinalCta() {
  // 폼 진입 직후엔 유형·세부 유형 모두 미선택 — 사용자가 능동적으로 고르게 한다.
  const [type, setType] = useState<InquiryType | "">("");
  const [subtype, setSubtype] = useState<string>("");
  const [sender, setSender] = useState("");
  const [email, setEmail] = useState("");
  const [message, setMessage] = useState("");
  // Honeypot — real visitors never see or fill this; bots that autofill do.
  const [honeypot, setHoneypot] = useState("");

  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  // Preselect 문의 유형/세부 유형 from the URL (e.g. Insights cards deep-link here).
  // Insights의 "이 주제로 문의하기"는 같은 페이지에서 ?ct=..&cs=..로 이동하므로
  // FinalCta는 리마운트 없이 params만 바뀐다. effect 대신 "렌더 중 조정"(이전 키 ref
  // 비교) 패턴으로 params 변화마다 다시 맞추되 사용자 클릭 선택은 그대로 유지한다.
  const params = useSearchParams();
  const ct = params.get("ct");
  const cs = params.get("cs");
  const [preselectKey, setPreselectKey] = useState<string | null>(null);
  const nextKey = `${ct}|${cs}`;
  if (preselectKey !== nextKey) {
    setPreselectKey(nextKey);
    const matched = inquiryOptions.find((option) => option.type === ct);
    if (matched) {
      const subs: string[] = matched.subtypes.map((item) => item.label);
      setType(matched.type);
      setSubtype(cs && subs.includes(cs) ? cs : "");
    }
  }

  const handleTypeChange = (nextType: InquiryType) => {
    setType(nextType);
    setSubtype(""); // 유형을 바꾸면 세부 유형은 다시 고르게 한다.
  };

  const canSubmit = Boolean(type && subtype) && !isPending;

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (!canSubmit) return;

    setErrorMessage(null);
    startTransition(async () => {
      const result = await submitInquiry({
        type,
        subtype,
        sender,
        contact: email,
        message,
        honeypot,
      });

      if (result.ok) {
        setStatus("success");
      } else {
        setErrorMessage(result.error);
      }
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setErrorMessage(null);
    setType("");
    setSubtype("");
    setSender("");
    setEmail("");
    setMessage("");
    setHoneypot("");
  };

  return (
    <Section
      id={sectionId.contact}
      className="relative flex min-h-[85vh] items-center overflow-hidden"
    >
      {/* Poster shapes — layered, cropped, bleeding off the right edge. */}
      <Ring className="pointer-events-none absolute top-10 right-[10%] size-20 text-brand-blue/50 md:size-28" />
      <Star className="pointer-events-none absolute top-[8%] right-[26%] hidden size-14 rotate-12 text-brand-yellow md:block lg:size-20" />

      <div className="relative grid items-center gap-12 lg:grid-cols-12 lg:gap-10">
        <div className="max-w-3xl lg:col-span-7">
          <Eyebrow dotClassName="bg-brand-red">Contact</Eyebrow>

          <h2 className="text-display mt-8 text-ink">
            Learn. Build.
            <br />
            Move <span className="text-brand-navy">Forward.</span>
          </h2>

          <p className="text-body-lg mt-8 max-w-xl text-ink/70">
            아이디어를 작동하는 소프트웨어와 실무 교육으로 옮기는 다음
            프로젝트, 지금 이야기를 시작해 보세요.
          </p>
        </div>

        <div className="relative overflow-hidden rounded-3xl border border-ink/10 bg-white p-5 shadow-none sm:p-7 lg:col-span-5">
          {status === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-4 py-10 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint">
                <Check className="size-7" aria-hidden />
              </span>
              <div>
                <p className="text-eyebrow text-ink/45">Thank you</p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                  문의가 접수되었습니다
                </h3>
                <p className="mt-3 max-w-xs text-sm font-medium text-ink/60">
                  확인 후 빠르게 연락드리겠습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/35 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                다시 작성하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <div>
                <p className="text-eyebrow text-ink/45">Start a conversation</p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                  문의하기
                </h3>
              </div>

              <fieldset className="mt-7 grid grid-cols-1 gap-2 sm:grid-cols-3">
                <legend className="sr-only">문의 유형</legend>
                {inquiryOptions.map(({ type: item }) => (
                  <label
                    key={item}
                    className={cn(
                      "flex min-h-11 cursor-pointer items-center justify-center rounded-full border px-3 text-center text-sm font-semibold transition-colors",
                      type === item
                        ? "border-brand-blue bg-brand-blue text-white"
                        : "border-ink/15 text-ink/70 hover:border-ink/35",
                    )}
                  >
                    <input
                      type="radio"
                      name="inquiryType"
                      value={item}
                      checked={type === item}
                      onChange={() => handleTypeChange(item)}
                      className="sr-only"
                    />
                    {item}
                  </label>
                ))}
              </fieldset>

              {type && (
                <SubtypeField
                  subtypes={subtypesFor(type).map((item) => item.label)}
                  value={subtype}
                  onChange={setSubtype}
                />
              )}

              <div className="mt-4 grid grid-cols-1 gap-4 sm:grid-cols-2">
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
                  이름/회사
                  <input
                    value={sender}
                    onChange={(event) => setSender(event.target.value)}
                    className="h-12 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white"
                    placeholder="KPOPSOFT"
                  />
                </label>
                <label className="flex flex-col gap-2 text-sm font-semibold text-ink/70">
                  연락처
                  <input
                    value={email}
                    onChange={(event) => setEmail(event.target.value)}
                    className="h-12 rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white"
                    placeholder="hello@example.com"
                    inputMode="email"
                  />
                </label>
              </div>

              <label className="mt-4 flex flex-col gap-2 text-sm font-semibold text-ink/70">
                문의 내용
                <textarea
                  value={message}
                  onChange={(event) => setMessage(event.target.value)}
                  className="min-h-36 resize-y rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white"
                  placeholder={placeholderFor(type, subtype)}
                />
              </label>

              {/*
                Honeypot — hidden from sighted users and screen readers alike
                (aria-hidden + off-screen position), out of tab order, and
                autocomplete disabled so form-fillers don't autofill it. Real
                visitors never touch this; bots that blind-fill forms do.
              */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0"
              >
                <label>
                  회사 웹사이트
                  <input
                    type="text"
                    name="company_website"
                    value={honeypot}
                    onChange={(event) => setHoneypot(event.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              {errorMessage && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 text-sm font-semibold text-brand-red"
                >
                  {errorMessage}
                </p>
              )}

              <button
                type="submit"
                disabled={!canSubmit}
                className="group mt-5 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-brand-blue"
              >
                {isPending ? "보내는 중…" : "문의 보내기"}
                <Send
                  className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                  aria-hidden
                />
              </button>
            </form>
          )}
        </div>
      </div>
    </Section>
  );
}
