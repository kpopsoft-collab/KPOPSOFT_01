"use client";

import { useState, useTransition } from "react";

import type { Accent } from "@/lib/site";
import {
  EDUCATION_SCHEDULE_TYPES,
  EDUCATION_TRACKS,
  educationScheduleTypeLabel,
  educationTrackLabel,
  type BundleIntent,
  type EducationRegularClass,
  type EducationRegularClassEdit,
  type EducationScheduleType,
  type EducationTrack,
  type HtmlIntent,
} from "@/lib/admin/content-types";
import {
  CheckboxField,
  CheckboxListField,
  DateField,
  RadioField,
  StringListField,
  TextAreaField,
  TextField,
} from "@/components/admin/content/fields";
import { BundleUpload } from "@/components/admin/content/bundle-upload";
import { HtmlUpload } from "@/components/admin/content/html-upload";
import { AccentPicker } from "@/components/admin/content/accent-picker";
import { ImageUpload } from "@/components/admin/content/image-upload";
import { FormActions } from "@/components/admin/content/education/form-actions";

// detailHtml은 서버 전용 정제 결과라 폼이 못 채운다 — 대신 htmlIntent로
// "무엇을 할지"를 보낸다(actions.ts의 Input과 구조적으로 같아야 한다).
// 번들 두 필드도 마찬가지다: 값을 그대로 돌려보내면 "안 건드림"과 "비워라"가
// 구분되지 않아 옛 폴더 삭제 판단을 서버가 못 한다.
type Input = Omit<
  EducationRegularClass,
  "id" | "sortOrder" | "detailHtml" | "detailBundlePath" | "detailBundleName"
> & {
  htmlIntent: HtmlIntent;
  bundleIntent: BundleIntent;
};

/** 상세 본문의 출처 — 셋 중 하나다. 둘을 겹쳐 쓰지 않는다. */
type DetailSource = "none" | "html" | "bundle";

const DETAIL_SOURCE_OPTIONS: { value: DetailSource; label: string }[] = [
  { value: "none", label: "없음 (커리큘럼 목록)" },
  { value: "html", label: "HTML 파일 1개" },
  { value: "bundle", label: "zip 번들 (여러 파일)" },
];

export function RegularClassForm({
  initial,
  onSave,
}: {
  initial?: EducationRegularClassEdit;
  onSave: (input: Input) => Promise<void>;
}) {
  const [slug, setSlug] = useState(initial?.slug ?? "");
  const [indexLabel, setIndexLabel] = useState(initial?.indexLabel ?? "");
  const [name, setName] = useState(initial?.name ?? "");
  const [subtitle, setSubtitle] = useState(initial?.subtitle ?? "");
  const [description, setDescription] = useState(initial?.description ?? "");
  const [duration, setDuration] = useState(initial?.duration ?? "");
  const [level, setLevel] = useState(initial?.level ?? "");
  const [tracks, setTracks] = useState<EducationTrack[]>(initial?.tracks ?? []);
  const [accent, setAccent] = useState<Accent>(initial?.accent ?? "blue");
  const [imageUrl, setImageUrl] = useState<string | undefined>(initial?.imageUrl);
  const [imageAlt, setImageAlt] = useState(initial?.imageAlt ?? "");
  const [imageCaption, setImageCaption] = useState(initial?.imageCaption ?? "");
  const [curriculum, setCurriculum] = useState<string[]>(initial?.curriculum ?? []);
  const [detailHref, setDetailHref] = useState(initial?.detailHref ?? "");
  const [seoTitle, setSeoTitle] = useState(initial?.seoTitle ?? "");
  const [seoDescription, setSeoDescription] = useState(initial?.seoDescription ?? "");
  const [isPublished, setIsPublished] = useState(initial?.isPublished ?? true);
  const [scheduleType, setScheduleType] = useState<EducationScheduleType>(
    initial?.scheduleType ?? "multi",
  );
  const [startDate, setStartDate] = useState(initial?.startDate ?? "");
  const [endDate, setEndDate] = useState(initial?.endDate ?? "");
  // 업로드 위젯이 보여줄 값 — 저장 의도(htmlIntent)와 분리해서 들고 있는다.
  // initial이 이미 정제본이 아니라 "동반 테이블의 원본"을 주므로 다시
  // 여는 화면에서도 원본 그대로 보인다.
  const [htmlRaw, setHtmlRaw] = useState(initial?.detailHtmlRaw ?? "");
  const [htmlFileName, setHtmlFileName] = useState(initial?.detailHtmlFileName ?? "");
  const [htmlIntent, setHtmlIntent] = useState<HtmlIntent>({ kind: "keep" });
  // 번들도 같은 구조 — 위젯이 보여줄 경로·파일명과 저장 의도를 따로 들고 있는다.
  const [bundlePath, setBundlePath] = useState(initial?.detailBundlePath ?? "");
  const [bundleName, setBundleName] = useState(initial?.detailBundleName ?? "");
  const [bundleIntent, setBundleIntent] = useState<BundleIntent>({ kind: "keep" });
  // 업로드가 끝나기 전에 저장하면 intent가 아직 "keep"이라 컬럼은 안 붙고,
  // 이미 올라간 파일 수십 개만 Storage에 고아로 남는다. 그동안 저장을 막는다.
  const [bundleUploading, setBundleUploading] = useState(false);
  // 상세 본문은 HTML 한 장이거나 zip 번들이거나 둘 중 하나다. 둘 다 채워 두면
  // 상세 페이지가 무엇을 그릴지 이 화면에서 알 수 없다. 지금 무엇이 들어 있는지로
  // 초기값을 정한다 — detailHtmlRaw가 비어도(동반 테이블 없는 옛 데이터)
  // 정제본이 있으면 HTML이다.
  const [detailSource, setDetailSource] = useState<DetailSource>(
    initial?.detailBundlePath
      ? "bundle"
      : initial?.detailHtmlRaw || initial?.detailHtml
        ? "html"
        : "none",
  );
  const [pending, start] = useTransition();

  /**
   * 고르지 않은 쪽은 저장할 때 비운다. 라디오를 실제로 움직였을 때만 remove가
   * 되므로, 이름만 고쳐 저장하는 경우에는 양쪽 다 "keep"으로 남는다.
   */
  const changeDetailSource = (next: DetailSource) => {
    setDetailSource(next);
    if (next !== "html") {
      setHtmlRaw("");
      setHtmlFileName("");
      setHtmlIntent({ kind: "remove" });
    }
    if (next !== "bundle") {
      setBundlePath("");
      setBundleName("");
      setBundleIntent({ kind: "remove" });
    }
  };

  // DB CHECK(education_regular_classes_schedule_ck)와 같은 규칙: 종료일이 있으면
  // 시작일도 있어야 하고(그래야 "종료일만 입력"이 막힌다), 있으면 순서도 맞아야
  // 한다. ISO 문자열은 사전순 비교가 곧 시간순 비교라 Date 파싱이 필요 없다.
  const dateInvalid =
    scheduleType === "multi" && Boolean(endDate) && (!startDate || endDate < startDate);

  const canSave =
    Boolean(name.trim() && slug.trim()) && !dateInvalid && !pending && !bundleUploading;

  return (
    <form
      onSubmit={(e) => {
        e.preventDefault();
        if (!canSave) return;
        start(() =>
          onSave({
            slug: slug.trim(),
            indexLabel: indexLabel.trim(),
            name: name.trim(),
            subtitle: subtitle.trim(),
            description: description.trim(),
            duration: duration.trim(),
            level: level.trim(),
            tracks,
            accent,
            ...(imageUrl ? { imageUrl } : {}),
            imageAlt: imageAlt.trim(),
            imageCaption: imageCaption.trim(),
            curriculum,
            detailHref: detailHref.trim(),
            seoTitle: seoTitle.trim(),
            seoDescription: seoDescription.trim(),
            isPublished,
            scheduleType,
            startDate,
            // oneday는 서버(actions.ts normalize)도 종료일을 버리지만, 화면에서
            // 이미 감춰진 값을 실수로 들고 나가지 않도록 여기서도 비운다.
            endDate: scheduleType === "oneday" ? "" : endDate,
            htmlIntent,
            bundleIntent,
          }),
        );
      }}
      className="flex max-w-2xl flex-col gap-6"
    >
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="과정명" value={name} onChange={setName} required placeholder="AI 활용" />
        <TextField label="부제" value={subtitle} onChange={setSubtitle} placeholder="AI 도구 마스터" />
      </div>
      <TextAreaField label="설명" value={description} onChange={setDescription} rows={4} />

      <div className="grid gap-6 sm:grid-cols-3">
        <TextField label="순번 표기" value={indexLabel} onChange={setIndexLabel} placeholder="01" />
        <TextField label="기간" value={duration} onChange={setDuration} placeholder="4주" />
        <TextField label="난이도 표기" value={level} onChange={setLevel} placeholder="입문·중급" />
      </div>

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-ink/15 p-4">
        <legend className="px-1 text-sm font-semibold text-ink/70">강의 일정</legend>
        <RadioField
          label="일정 유형"
          value={scheduleType}
          onChange={setScheduleType}
          options={EDUCATION_SCHEDULE_TYPES.map((t) => ({
            value: t,
            label: educationScheduleTypeLabel[t],
          }))}
        />
        <p className="text-xs font-medium text-ink/45">
          날짜는 비워 둬도 됩니다. 비우면 화면에 기간 표기(예: 4주)만 나옵니다.
        </p>
        {scheduleType === "oneday" ? (
          <DateField label="강의일" value={startDate} onChange={setStartDate} />
        ) : (
          <div className="grid gap-6 sm:grid-cols-2">
            <DateField label="시작일" value={startDate} onChange={setStartDate} />
            <DateField label="종료일" value={endDate} onChange={setEndDate} />
          </div>
        )}
        {dateInvalid && (
          <p role="alert" className="text-sm font-medium text-brand-red">
            종료일은 시작일보다 빠를 수 없어요.
          </p>
        )}
      </fieldset>

      {/* 난이도 표기와 별개다 — 표기에는 "비개발자 환영" 같은 값도 들어오므로,
          목적 선택이 정렬에 쓰는 축은 이쪽 트랙으로 따로 둔다. */}
      <CheckboxListField
        label="학습 트랙 (목적 선택 정렬에 쓰임)"
        options={EDUCATION_TRACKS.map((t) => ({ value: t, label: educationTrackLabel[t] }))}
        values={tracks}
        onChange={(v) => setTracks(v as EducationTrack[])}
      />

      <div className="flex flex-col gap-2">
        <span className="text-sm font-semibold text-ink/70">카드 색상</span>
        <AccentPicker value={accent} onChange={setAccent} />
      </div>

      <ImageUpload value={imageUrl} onChange={setImageUrl} bucket="education" label="과정 이미지" />
      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="이미지 대체 텍스트" value={imageAlt} onChange={setImageAlt} />
        <TextField label="이미지 캡션" value={imageCaption} onChange={setImageCaption} />
      </div>

      <StringListField label="주차별 커리큘럼" values={curriculum} onChange={setCurriculum} />

      <fieldset className="flex flex-col gap-4 rounded-2xl border border-ink/15 p-4">
        <legend className="px-1 text-sm font-semibold text-ink/70">상세 본문</legend>
        <RadioField
          label="본문 방식"
          value={detailSource}
          onChange={changeDetailSource}
          options={DETAIL_SOURCE_OPTIONS}
        />
        <p className="text-xs font-medium text-ink/45">
          방식을 바꾸고 저장하면 쓰지 않는 쪽은 지워집니다.
        </p>

        {detailSource === "html" && (
          <HtmlUpload
            value={htmlRaw}
            fileName={htmlFileName}
            onChange={(raw, fileName) => {
              setHtmlRaw(raw);
              setHtmlFileName(fileName);
              setHtmlIntent({ kind: "replace", raw, fileName });
            }}
            onRemove={() => {
              setHtmlRaw("");
              setHtmlFileName("");
              setHtmlIntent({ kind: "remove" });
            }}
          />
        )}

        {detailSource === "bundle" && (
          <BundleUpload
            path={bundlePath}
            fileName={bundleName}
            onChange={(path, fileName) => {
              setBundlePath(path);
              setBundleName(fileName);
              setBundleIntent({ kind: "replace", path, fileName });
            }}
            onRemove={() => {
              setBundlePath("");
              setBundleName("");
              setBundleIntent({ kind: "remove" });
            }}
            onBusyChange={setBundleUploading}
          />
        )}
      </fieldset>

      <div className="grid gap-6 sm:grid-cols-2">
        <TextField label="슬러그" value={slug} onChange={setSlug} required placeholder="ai-tools" />
        {/* 상세 페이지는 슬러그로 자동 생성된다(/education/programs/[슬러그]).
            이 칸은 사내 상세가 따로 있는 과정을 위한 예외 통로라, http로
            시작하는 주소일 때만 카드가 그쪽으로 간다. */}
        <TextField
          label="외부 상세 링크 (선택)"
          value={detailHref}
          onChange={setDetailHref}
          placeholder="https://... (비우면 슬러그 상세로 간다)"
        />
      </div>
      <TextField label="SEO 제목" value={seoTitle} onChange={setSeoTitle} />
      <TextAreaField label="SEO 설명" value={seoDescription} onChange={setSeoDescription} rows={3} />

      <CheckboxField label="공개 노출" checked={isPublished} onChange={setIsPublished} />
      <FormActions
        pending={pending}
        canSave={canSave}
        backHref="/admin/content/education/regular-classes"
      />
    </form>
  );
}
