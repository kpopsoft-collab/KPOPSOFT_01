"use client";

/**
 * SECTION 15 — 기업 교육 문의 폼 (docs §20).
 *
 * The public contact-form infrastructure (`submitInquiry` Server Action →
 * `getAdminData().createInquiry`) only models a flat
 * type/subtype/sender/contact/message row (`src/lib/admin/types.ts`,
 * off-limits — another track owns it). Rather than fork a second inquiry
 * pipeline, this form reuses that exact seam ("기존 문의 저장 구조 재사용",
 * §20 마지막 요구사항): `type` is fixed to the existing "교육 문의" type,
 * `subtype` is the selected 관심 프로그램, and every other field from §20
 * (회사명, 담당자명, 예상 인원, 직무, 희망 일정, 교육 방식, AI 활용 수준,
 * 해결하고 싶은 업무, 회사 웹사이트) is folded into a structured `message`
 * so nothing the visitor typed is lost.
 */
import { type FormEvent, useState, useTransition } from "react";
import { Check as CheckIcon, Send } from "lucide-react";

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
import { educationSectionId } from "@/lib/site";
import {
  inquiryAiLevelOptions,
  inquiryFormatOptions,
  inquiryProgramOptions,
} from "@/lib/education-content";
import { cn } from "@/lib/utils";

type FieldKey =
  | "company"
  | "contactName"
  | "email"
  | "phone"
  | "headcount"
  | "program"
  | "message"
  | "consent";

const inputClass =
  "h-12 w-full rounded-2xl border border-ink/15 bg-ivory/60 px-4 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white aria-invalid:border-brand-red";

const labelClass = "flex flex-col gap-2 text-sm font-semibold text-ink/70";

function FieldError({ id, message }: { id: string; message?: string }) {
  if (!message) return null;
  return (
    <p id={id} role="alert" className="text-sm font-semibold text-brand-red">
      {message}
    </p>
  );
}

function isBlank(value: string) {
  return value.trim().length === 0;
}

function isValidEmail(value: string) {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());
}

function isValidPhone(value: string) {
  return value.replace(/\D/g, "").length >= 7;
}

export function InquiryForm() {
  const [company, setCompany] = useState("");
  const [contactName, setContactName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [program, setProgram] = useState<string>("");
  const [department, setDepartment] = useState("");
  const [schedule, setSchedule] = useState("");
  const [format, setFormat] = useState<string>("");
  const [aiLevel, setAiLevel] = useState<string>("");
  const [goal, setGoal] = useState("");
  const [website, setWebsite] = useState("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);
  // Honeypot — hidden from sighted users; unrelated to the real, visible
  // "회사 웹사이트" field above.
  const [hpFax, setHpFax] = useState("");

  const [fieldErrors, setFieldErrors] = useState<Partial<Record<FieldKey, string>>>(
    {},
  );
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const validate = (): Partial<Record<FieldKey, string>> => {
    const errors: Partial<Record<FieldKey, string>> = {};
    if (isBlank(company)) errors.company = "회사명을 입력해 주세요.";
    if (isBlank(contactName)) errors.contactName = "담당자명을 입력해 주세요.";
    if (isBlank(email)) errors.email = "이메일을 입력해 주세요.";
    else if (!isValidEmail(email)) errors.email = "이메일 형식을 다시 확인해 주세요.";
    if (isBlank(phone)) errors.phone = "연락처를 입력해 주세요.";
    else if (!isValidPhone(phone)) errors.phone = "연락처 형식을 다시 확인해 주세요.";
    if (isBlank(headcount)) errors.headcount = "예상 교육 인원을 입력해 주세요.";
    if (isBlank(program)) errors.program = "관심 프로그램을 선택해 주세요.";
    if (isBlank(message)) errors.message = "문의 내용을 입력해 주세요.";
    if (!consent) errors.consent = "개인정보 수집 및 이용에 동의해 주세요.";
    return errors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (isPending || status === "success") return;

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    const messageLines = [
      `예상 교육 인원: ${headcount.trim()}`,
      `관심 프로그램: ${program}`,
      department.trim() && `직무/부서: ${department.trim()}`,
      schedule.trim() && `희망 일정: ${schedule.trim()}`,
      format && `교육 방식: ${format}`,
      aiLevel && `현재 AI 활용 수준: ${aiLevel}`,
      goal.trim() && `해결하고 싶은 업무: ${goal.trim()}`,
      website.trim() && `회사 웹사이트: ${website.trim()}`,
      "",
      "문의 내용:",
      message.trim(),
    ].filter((line): line is string => Boolean(line));

    startTransition(async () => {
      const result = await submitInquiry({
        type: "교육 문의",
        subtype: program,
        sender: `${contactName.trim()} (${company.trim()})`,
        contact: `${email.trim()} / ${phone.trim()}`,
        message: messageLines.join("\n"),
        honeypot: hpFax,
      });

      if (result.ok) {
        setStatus("success");
      } else {
        setSubmitError(result.error);
      }
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setSubmitError(null);
    setFieldErrors({});
    setCompany("");
    setContactName("");
    setEmail("");
    setPhone("");
    setHeadcount("");
    setProgram("");
    setDepartment("");
    setSchedule("");
    setFormat("");
    setAiLevel("");
    setGoal("");
    setWebsite("");
    setMessage("");
    setConsent(false);
    setHpFax("");
  };

  return (
    <Section id={educationSectionId.inquiry} className="relative overflow-hidden">
      <Ring
        aria-hidden
        className="pointer-events-none absolute top-10 -right-10 hidden size-40 text-brand-blue/10 lg:block"
      />
      <Star
        aria-hidden
        className="pointer-events-none absolute bottom-10 left-[6%] hidden size-16 rotate-12 text-brand-yellow/30 lg:block"
      />

      <div className="mx-auto max-w-3xl">
        <div className="text-center">
          <Eyebrow className="justify-center" dotClassName="bg-brand-blue">
            기업 교육 문의
          </Eyebrow>
          <h2 className="text-section mt-6 text-ink">
            기업 맞춤형 교육,
            <br />
            지금 상담을 요청하세요.
          </h2>
          <p className="mx-auto mt-6 max-w-xl text-body-lg text-ink/70">
            교육 대상, 인원, 업무 과제를 남겨주시면 담당자가 확인 후 빠르게
            연락드립니다.
          </p>
        </div>

        <div className="relative mt-12 overflow-hidden rounded-3xl border border-ink/10 bg-white p-6 sm:p-9 md:p-12">
          {status === "success" ? (
            <div
              role="status"
              aria-live="polite"
              className="flex flex-col items-center gap-4 py-12 text-center"
            >
              <span className="flex size-14 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint">
                <CheckIcon className="size-7" aria-hidden />
              </span>
              <div>
                <p className="text-eyebrow text-ink/45">Thank you</p>
                <h3 className="mt-2 text-2xl font-extrabold tracking-tight text-ink">
                  문의가 접수되었습니다
                </h3>
                <p className="mt-3 max-w-sm text-sm font-medium text-ink/60">
                  담당자가 확인 후 입력하신 연락처로 안내드리겠습니다.
                </p>
              </div>
              <button
                type="button"
                onClick={handleReset}
                className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink/70 transition-colors hover:border-ink/35 hover:text-ink focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white"
              >
                새로 작성하기
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} noValidate>
              <fieldset className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <legend className="sr-only">기업 교육 문의</legend>

                <label className={labelClass}>
                  회사명 <span aria-hidden className="text-brand-red">*</span>
                  <input
                    value={company}
                    onChange={(e) => setCompany(e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.company)}
                    aria-describedby={fieldErrors.company ? "err-company" : undefined}
                    className={inputClass}
                    placeholder="KPOPSOFT"
                  />
                  <FieldError id="err-company" message={fieldErrors.company} />
                </label>

                <label className={labelClass}>
                  담당자명 <span aria-hidden className="text-brand-red">*</span>
                  <input
                    value={contactName}
                    onChange={(e) => setContactName(e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.contactName)}
                    aria-describedby={
                      fieldErrors.contactName ? "err-contactName" : undefined
                    }
                    className={inputClass}
                    placeholder="홍길동"
                  />
                  <FieldError id="err-contactName" message={fieldErrors.contactName} />
                </label>

                <label className={labelClass}>
                  이메일 <span aria-hidden className="text-brand-red">*</span>
                  <input
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    inputMode="email"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.email)}
                    aria-describedby={fieldErrors.email ? "err-email" : undefined}
                    className={inputClass}
                    placeholder="hello@example.com"
                  />
                  <FieldError id="err-email" message={fieldErrors.email} />
                </label>

                <label className={labelClass}>
                  연락처 <span aria-hidden className="text-brand-red">*</span>
                  <input
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    inputMode="tel"
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.phone)}
                    aria-describedby={fieldErrors.phone ? "err-phone" : undefined}
                    className={inputClass}
                    placeholder="010-0000-0000"
                  />
                  <FieldError id="err-phone" message={fieldErrors.phone} />
                </label>

                <label className={labelClass}>
                  예상 교육 인원 <span aria-hidden className="text-brand-red">*</span>
                  <input
                    value={headcount}
                    onChange={(e) => setHeadcount(e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.headcount)}
                    aria-describedby={
                      fieldErrors.headcount ? "err-headcount" : undefined
                    }
                    className={inputClass}
                    placeholder="예) 20명"
                  />
                  <FieldError id="err-headcount" message={fieldErrors.headcount} />
                </label>

                <label className={labelClass}>
                  관심 프로그램 <span aria-hidden className="text-brand-red">*</span>
                  <Select
                    value={program || null}
                    onValueChange={(next: string | null) => next && setProgram(next)}
                  >
                    <SelectTrigger
                      aria-label="관심 프로그램"
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.program)}
                      aria-describedby={
                        fieldErrors.program ? "err-program" : undefined
                      }
                    >
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
                      {inquiryProgramOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <FieldError id="err-program" message={fieldErrors.program} />
                </label>

                <label className={labelClass}>
                  직무 또는 부서
                  <input
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className={inputClass}
                    placeholder="예) 인사팀"
                  />
                </label>

                <label className={labelClass}>
                  희망 일정
                  <input
                    value={schedule}
                    onChange={(e) => setSchedule(e.target.value)}
                    className={inputClass}
                    placeholder="예) 8월 중"
                  />
                </label>

                <label className={labelClass}>
                  교육 방식
                  <Select
                    value={format || null}
                    onValueChange={(next: string | null) => next && setFormat(next)}
                  >
                    <SelectTrigger aria-label="교육 방식">
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
                      {inquiryFormatOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className={labelClass}>
                  현재 AI 활용 수준
                  <Select
                    value={aiLevel || null}
                    onValueChange={(next: string | null) => next && setAiLevel(next)}
                  >
                    <SelectTrigger aria-label="현재 AI 활용 수준">
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
                      {inquiryAiLevelOptions.map((item) => (
                        <SelectItem key={item} value={item}>
                          {item}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>

                <label className={labelClass}>
                  회사 웹사이트
                  <input
                    value={website}
                    onChange={(e) => setWebsite(e.target.value)}
                    inputMode="url"
                    className={inputClass}
                    placeholder="https://example.com"
                  />
                </label>

                <label className={cn(labelClass, "sm:col-span-2")}>
                  해결하고 싶은 업무
                  <input
                    value={goal}
                    onChange={(e) => setGoal(e.target.value)}
                    className={inputClass}
                    placeholder="예) 반복되는 보고서 작성 업무를 줄이고 싶습니다."
                  />
                </label>

                <label className={cn(labelClass, "sm:col-span-2")}>
                  문의 내용 <span aria-hidden className="text-brand-red">*</span>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    aria-required="true"
                    aria-invalid={Boolean(fieldErrors.message)}
                    aria-describedby={fieldErrors.message ? "err-message" : undefined}
                    className="min-h-36 resize-y rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white aria-invalid:border-brand-red"
                    placeholder="교육 배경과 목표, 궁금하신 점을 자유롭게 남겨주세요."
                  />
                  <FieldError id="err-message" message={fieldErrors.message} />
                </label>
              </fieldset>

              {/* Honeypot — hidden from sighted users and screen readers,
                  out of tab order. Unrelated to the real "회사 웹사이트" field. */}
              <div
                aria-hidden="true"
                className="pointer-events-none absolute left-0 top-0 size-px overflow-hidden opacity-0"
              >
                <label>
                  팩스 번호
                  <input
                    type="text"
                    name="fax_number"
                    value={hpFax}
                    onChange={(e) => setHpFax(e.target.value)}
                    tabIndex={-1}
                    autoComplete="off"
                  />
                </label>
              </div>

              <label className="mt-6 flex min-h-11 cursor-pointer items-start gap-3 text-sm text-ink/75">
                <input
                  type="checkbox"
                  checked={consent}
                  onChange={(e) => setConsent(e.target.checked)}
                  aria-required="true"
                  aria-invalid={Boolean(fieldErrors.consent)}
                  aria-describedby={fieldErrors.consent ? "err-consent" : undefined}
                  className="mt-0.5 size-5 shrink-0 rounded border-ink/30 accent-brand-blue"
                />
                <span>
                  개인정보 수집 및 이용에 동의합니다.{" "}
                  <span aria-hidden className="text-brand-red">*</span>
                  <br />
                  <span className="text-ink/50">
                    남겨주신 정보는 상담 목적으로만 사용되며, 상담 완료 후 관련
                    법령에 따라 처리됩니다.
                  </span>
                </span>
              </label>
              <FieldError id="err-consent" message={fieldErrors.consent} />

              {submitError && (
                <p
                  role="alert"
                  aria-live="assertive"
                  className="mt-4 text-sm font-semibold text-brand-red"
                >
                  {submitError}
                </p>
              )}

              <button
                type="submit"
                disabled={isPending}
                className="group mt-7 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors hover:bg-brand-navy focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-brand-blue"
              >
                {isPending ? "보내는 중…" : "기업 교육 상담 신청하기"}
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
