"use client";

/**
 * 교육 문의 (수정 요청서 §13).
 *
 * 문의 유형(개인 / 기업·조직)에 따라 묻는 것이 달라진다. 개인에게 "예상 참여
 * 인원"이나 "교육 대상 및 직무"를 묻는 건 답할 수 없는 질문이고, 그런 칸이
 * 하나만 있어도 폼 전체가 자기 것이 아닌 것처럼 느껴진다.
 *
 * ver3의 "이메일 먼저 받고 펼치기" 단계는 걷어냈다. 유형 선택이 첫 질문이
 * 되면서 그 자체가 진입 문턱을 낮추는 역할을 하고, 두 단계를 겹쳐 두면 유형을
 * 고르기도 전에 이메일부터 요구하는 순서가 된다.
 *
 * 저장 구조는 그대로 재사용한다 — 공개 문의 파이프라인(`submitInquiry` →
 * `getAdminData().createInquiry`)은 type/subtype/sender/contact/message 한 줄
 * 모델이라, 유형별 추가 항목은 구조화된 `message`로 접어 넣어 입력한 내용이
 * 하나도 사라지지 않게 한다. 두 번째 문의 파이프라인을 만들지 않는다.
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
import { Circle, Wave } from "@/components/shapes";
import { submitInquiry } from "@/lib/inquiry-actions";
import { educationSectionId } from "@/lib/site";
import {
  inquiryAiLevelOptions,
  inquiryFormatOptions,
  inquiryProgramOptions,
} from "@/lib/education-content";
import { cn } from "@/lib/utils";

/** 문의 유형 — 폼 구성을 가르는 유일한 축(§13). */
type Audience = "individual" | "org";

const AUDIENCE_OPTIONS: { value: Audience; label: string; hint: string }[] = [
  {
    value: "individual",
    label: "개인 교육",
    hint: "정규 과정·클럽을 개인으로 신청",
  },
  {
    value: "org",
    label: "기업·조직 교육",
    hint: "팀 단위 5명 이상 맞춤 교육",
  },
];

type FieldKey =
  | "name"
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

/**
 * 라벨 텍스트 + 필수 표시. 한 덩어리로 묶는 이유 — 감싸는 label이
 * `flex-col`이라 표시를 형제로 두면 별표가 제 줄로 떨어져 나간다.
 */
function FieldLabel({
  children,
  required,
}: {
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <span className="flex items-center gap-1">
      {children}
      {required ? (
        <span aria-hidden className="text-brand-red">
          *
        </span>
      ) : null}
    </span>
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
  const [audience, setAudience] = useState<Audience>("individual");

  // 공통
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [program, setProgram] = useState<string>("");
  const [message, setMessage] = useState("");
  const [consent, setConsent] = useState(false);

  // 기업·조직 전용
  const [contactName, setContactName] = useState("");
  const [headcount, setHeadcount] = useState("");
  const [schedule, setSchedule] = useState("");
  const [department, setDepartment] = useState("");
  const [goal, setGoal] = useState("");
  const [aiLevel, setAiLevel] = useState<string>("");
  const [format, setFormat] = useState<string>("");

  // Honeypot — 사용자에게도 스크린리더에도 보이지 않는다.
  const [hpFax, setHpFax] = useState("");

  const [fieldErrors, setFieldErrors] = useState<
    Partial<Record<FieldKey, string>>
  >({});
  const [status, setStatus] = useState<"idle" | "success">("idle");
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const isOrg = audience === "org";

  const validate = (): Partial<Record<FieldKey, string>> => {
    const errors: Partial<Record<FieldKey, string>> = {};

    if (isBlank(name)) {
      errors.name = isOrg ? "회사명을 입력해 주세요." : "이름을 입력해 주세요.";
    }
    if (isBlank(email)) errors.email = "이메일을 입력해 주세요.";
    else if (!isValidEmail(email))
      errors.email = "이메일 형식을 다시 확인해 주세요.";
    if (isBlank(phone)) errors.phone = "연락처를 입력해 주세요.";
    else if (!isValidPhone(phone))
      errors.phone = "연락처 형식을 다시 확인해 주세요.";
    if (isBlank(program)) errors.program = "관심 교육을 선택해 주세요.";
    if (isBlank(message)) errors.message = "문의 내용을 입력해 주세요.";
    if (!consent) errors.consent = "개인정보 수집 및 이용에 동의해 주세요.";

    // 기업 전용 필수 — 인원이 없으면 견적도 일정도 잡히지 않는다.
    if (isOrg && isBlank(headcount)) {
      errors.headcount = "예상 참여 인원을 입력해 주세요.";
    }

    return errors;
  };

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    // 제출 중 중복 클릭 방지(§13).
    if (isPending || status === "success") return;

    const errors = validate();
    setFieldErrors(errors);
    setSubmitError(null);
    if (Object.keys(errors).length > 0) return;

    const detail = isOrg
      ? [
          `예상 참여 인원: ${headcount.trim()}`,
          schedule.trim() && `희망 일정: ${schedule.trim()}`,
          department.trim() && `교육 대상 및 직무: ${department.trim()}`,
          goal.trim() && `교육 목적: ${goal.trim()}`,
          aiLevel && `현재 AI 활용 수준: ${aiLevel}`,
          format && `희망 진행 방식: ${format}`,
          contactName.trim() && `담당자명: ${contactName.trim()}`,
        ]
      : [];

    const messageLines = [
      `문의 유형: ${isOrg ? "기업·조직 교육" : "개인 교육"}`,
      `관심 교육: ${program}`,
      ...detail,
      "",
      "문의 내용:",
      message.trim(),
      // 빈 문자열은 본문 앞의 의도된 빈 줄이므로 남기고, 조건이 거짓이라
      // 생긴 `false`만 걷어낸다.
    ].filter((line): line is string => typeof line === "string");

    startTransition(async () => {
      const result = await submitInquiry({
        type: "교육 문의",
        subtype: program,
        sender:
          isOrg && contactName.trim()
            ? `${contactName.trim()} (${name.trim()})`
            : name.trim(),
        email: email.trim(),
        phone: phone.trim(),
        message: messageLines.join("\n"),
        honeypot: hpFax,
      });

      if (result.ok) setStatus("success");
      else setSubmitError(result.error);
    });
  };

  const handleReset = () => {
    setStatus("idle");
    setSubmitError(null);
    setFieldErrors({});
    setName("");
    setEmail("");
    setPhone("");
    setProgram("");
    setMessage("");
    setConsent(false);
    setContactName("");
    setHeadcount("");
    setSchedule("");
    setDepartment("");
    setGoal("");
    setAiLevel("");
    setFormat("");
    setHpFax("");
  };

  return (
    <Section
      id={educationSectionId.inquiry}
      className="relative scroll-mt-36 overflow-hidden bg-brand-navy"
    >
      {/* Green Wave + Blue Circle 배경 그래픽(§13). 장식이므로 스크린리더에서
          제외하고, 글자 위로 올라오지 않게 뒤에 깔린다. 카드 대신 화면 전폭
          밴드가 되면서 도형도 섹션 전체를 기준으로 놓인다. */}
      <div aria-hidden className="pointer-events-none absolute inset-0">
        <Circle className="absolute -top-20 -right-20 size-80 text-brand-blue/25" />
        <Wave className="absolute -bottom-10 -left-12 w-80 text-brand-mint/30" />
      </div>

      <div className="relative grid grid-cols-1 gap-12 lg:grid-cols-12 lg:gap-14">
        <div className="lg:col-span-5">
          <Eyebrow dotClassName="bg-brand-mint" className="text-ivory/60">
            교육 문의
          </Eyebrow>
          <h2 className="mt-6 text-3xl leading-tight font-black tracking-tight text-ivory md:text-4xl lg:text-5xl">
            어떤 교육이 필요한지부터
            <br />
            함께 설계합니다.
          </h2>
          <p className="mt-6 max-w-md text-base leading-relaxed text-ivory/70 md:text-lg">
            대상과 목적, 현재 AI 활용 수준을 알려주시면 적합한 프로그램과 진행
            방식을 제안해드립니다.
          </p>
        </div>

        <div className="lg:col-span-7">
          <div className="rounded-3xl bg-white p-6 sm:p-8 md:p-10">
            {status === "success" ? (
              <div
                role="status"
                aria-live="polite"
                className="flex flex-col items-center gap-4 py-12 text-center"
              >
                <span className="flex size-14 items-center justify-center rounded-full bg-brand-mint/15 text-brand-mint">
                  <CheckIcon className="size-7" aria-hidden />
                </span>
                <p className="max-w-sm text-base font-semibold text-ink">
                  문의가 정상적으로 접수되었습니다. 확인 후 빠르게
                  연락드리겠습니다.
                </p>
                <button
                  type="button"
                  onClick={handleReset}
                  className="mt-2 inline-flex h-11 items-center justify-center rounded-full border border-ink/15 px-6 text-sm font-semibold text-ink/70 transition-colors outline-none hover:border-ink/35 hover:text-ink focus-visible:ring-3 focus-visible:ring-brand-blue/40"
                >
                  새로 작성하기
                </button>
              </div>
            ) : (
              <form onSubmit={handleSubmit} noValidate className="relative">
                {/* 유형 선택 — 라디오 그룹이라 방향키로 오갈 수 있고,
                      선택 상태가 스크린리더에 그대로 전달된다. */}
                <fieldset>
                  <legend className="text-sm font-semibold text-ink/70">
                    <FieldLabel required>문의 유형</FieldLabel>
                  </legend>
                  <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
                    {AUDIENCE_OPTIONS.map((option) => {
                      const checked = audience === option.value;
                      return (
                        <label
                          key={option.value}
                          className={cn(
                            "flex cursor-pointer flex-col gap-1 rounded-2xl border px-5 py-4 transition-colors",
                            checked
                              ? "border-brand-blue bg-brand-blue/5"
                              : "border-ink/15 hover:border-ink/30",
                          )}
                        >
                          <span className="flex items-center gap-2.5">
                            <input
                              type="radio"
                              name="audience"
                              value={option.value}
                              checked={checked}
                              onChange={() => setAudience(option.value)}
                              className="size-4 accent-brand-blue"
                            />
                            <span className="font-semibold text-ink">
                              {option.label}
                            </span>
                          </span>
                          <span className="pl-6.5 text-sm text-ink/55">
                            {option.hint}
                          </span>
                        </label>
                      );
                    })}
                  </div>
                </fieldset>

                <div className="mt-7 grid grid-cols-1 gap-5 sm:grid-cols-2">
                  <label className={labelClass}>
                    <FieldLabel required>
                      {isOrg ? "회사명" : "이름"}
                    </FieldLabel>
                    <input
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.name)}
                      aria-describedby={
                        fieldErrors.name ? "err-name" : undefined
                      }
                      className={inputClass}
                      placeholder={isOrg ? "KPOPSOFT" : "홍길동"}
                    />
                    <FieldError id="err-name" message={fieldErrors.name} />
                  </label>

                  {isOrg ? (
                    <label className={labelClass}>
                      담당자명
                      <input
                        value={contactName}
                        onChange={(e) => setContactName(e.target.value)}
                        className={inputClass}
                        placeholder="홍길동"
                      />
                    </label>
                  ) : null}

                  <label className={labelClass}>
                    <FieldLabel required>이메일</FieldLabel>
                    <input
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      inputMode="email"
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.email)}
                      aria-describedby={
                        fieldErrors.email ? "err-email" : undefined
                      }
                      className={inputClass}
                      placeholder="hello@example.com"
                    />
                    <FieldError id="err-email" message={fieldErrors.email} />
                  </label>

                  <label className={labelClass}>
                    <FieldLabel required>연락처</FieldLabel>
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      inputMode="tel"
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.phone)}
                      aria-describedby={
                        fieldErrors.phone ? "err-phone" : undefined
                      }
                      className={inputClass}
                      placeholder="010-0000-0000"
                    />
                    <FieldError id="err-phone" message={fieldErrors.phone} />
                  </label>

                  <label className={cn(labelClass, !isOrg && "sm:col-span-2")}>
                    <FieldLabel required>관심 교육</FieldLabel>
                    <Select
                      value={program || null}
                      onValueChange={(next: string | null) =>
                        next && setProgram(next)
                      }
                    >
                      <SelectTrigger
                        aria-label="관심 교육"
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
                    <FieldError
                      id="err-program"
                      message={fieldErrors.program}
                    />
                  </label>

                  {/* ---- 기업·조직 전용 항목(§13) ---- */}
                  {isOrg ? (
                    <>
                      <label className={labelClass}>
                        <FieldLabel required>예상 참여 인원</FieldLabel>
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
                        <FieldError
                          id="err-headcount"
                          message={fieldErrors.headcount}
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
                        교육 대상 및 직무
                        <input
                          value={department}
                          onChange={(e) => setDepartment(e.target.value)}
                          className={inputClass}
                          placeholder="예) 마케팅팀 실무자"
                        />
                      </label>

                      <label className={labelClass}>
                        현재 AI 활용 수준
                        <Select
                          value={aiLevel || null}
                          onValueChange={(next: string | null) =>
                            next && setAiLevel(next)
                          }
                        >
                          <SelectTrigger aria-label="현재 AI 활용 수준">
                            <SelectValue>
                              {(selected) =>
                                selected ? (
                                  (selected as string)
                                ) : (
                                  <span className="text-ink/40">
                                    선택해주세요
                                  </span>
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
                        희망 진행 방식
                        <Select
                          value={format || null}
                          onValueChange={(next: string | null) =>
                            next && setFormat(next)
                          }
                        >
                          <SelectTrigger aria-label="희망 진행 방식">
                            <SelectValue>
                              {(selected) =>
                                selected ? (
                                  (selected as string)
                                ) : (
                                  <span className="text-ink/40">
                                    선택해주세요
                                  </span>
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

                      <label className={cn(labelClass, "sm:col-span-2")}>
                        교육 목적
                        <input
                          value={goal}
                          onChange={(e) => setGoal(e.target.value)}
                          className={inputClass}
                          placeholder="예) 반복되는 보고서 작성 업무를 줄이고 싶습니다."
                        />
                      </label>
                    </>
                  ) : null}

                  <label className={cn(labelClass, "sm:col-span-2")}>
                    <FieldLabel required>문의 내용</FieldLabel>
                    <textarea
                      value={message}
                      onChange={(e) => setMessage(e.target.value)}
                      aria-required="true"
                      aria-invalid={Boolean(fieldErrors.message)}
                      aria-describedby={
                        fieldErrors.message ? "err-message" : undefined
                      }
                      className="min-h-32 resize-y rounded-2xl border border-ink/15 bg-ivory/60 px-4 py-3 text-base font-medium text-ink outline-none transition-colors placeholder:text-ink/35 focus:border-brand-blue focus:bg-white aria-invalid:border-brand-red"
                      placeholder="교육 배경과 목표, 궁금하신 점을 자유롭게 남겨주세요."
                    />
                    <FieldError
                      id="err-message"
                      message={fieldErrors.message}
                    />
                  </label>
                </div>

                {/* Honeypot — 화면·스크린리더·탭 순서 모두에서 제외.
                      실제 입력 칸과 무관하다. */}
                <div
                  aria-hidden="true"
                  className="pointer-events-none absolute top-0 left-0 size-px overflow-hidden opacity-0"
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
                    aria-describedby={
                      fieldErrors.consent ? "err-consent" : undefined
                    }
                    className="mt-0.5 size-5 shrink-0 rounded border-ink/30 accent-brand-blue"
                  />
                  <span>
                    개인정보 수집 및 이용에 동의합니다.{" "}
                    <span aria-hidden className="text-brand-red">
                      *
                    </span>
                    <br />
                    <span className="text-ink/50">
                      남겨주신 정보는 상담 목적으로만 사용되며, 상담 완료 후
                      관련 법령에 따라 처리됩니다.
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
                  className="group mt-7 inline-flex h-13 w-full items-center justify-center gap-2 rounded-full bg-brand-blue px-7 font-semibold text-white transition-colors outline-none hover:bg-brand-navy focus-visible:ring-3 focus-visible:ring-brand-blue/40 focus-visible:ring-offset-2 focus-visible:ring-offset-white disabled:cursor-not-allowed disabled:opacity-45 disabled:hover:bg-brand-blue"
                >
                  {isPending ? "보내는 중…" : "교육 상담 요청하기"}
                  <Send
                    className="size-4 transition-transform duration-200 group-hover:translate-x-0.5"
                    aria-hidden
                  />
                </button>
              </form>
            )}
          </div>
        </div>
      </div>
    </Section>
  );
}
