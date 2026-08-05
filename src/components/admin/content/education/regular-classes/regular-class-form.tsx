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

/**
 * 상세 자료의 출처 — 둘 중 하나다.
 *
 * 예전에는 `"html"`이 따로 있었다(HTML 한 장을 정제해 `detail_html` 컬럼에
 * 넣고 공개 페이지에 인라인으로 그리는 경로). **폐지했다** — 정제가
 * `<script>`와 `@keyframes`를 지워서 완성된 문서 한 장이 빈 화면으로 나왔다
 * (백로그 06 01-현황분석 §2·§3). 지금은 `.html` 한 장도 zip과 같은 위젯으로
 * Storage에 올라가 `"bundle"` 하나로 합쳐졌다(백로그 06 D2).
 */
type DetailSource = "none" | "bundle";

const DETAIL_SOURCE_OPTIONS: { value: DetailSource; label: string }[] = [
  { value: "none", label: "없음 (커리큘럼 목록만)" },
  { value: "bundle", label: "상세 자료 (zip 또는 HTML 한 장)" },
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
  /**
   * `detail_html`은 이 폼이 더 이상 쓰지 않는다. 그래도 **항상 "keep"으로**
   * 보낸다 — 컬럼과 동반 테이블(원본)을 아직 지우지 않기로 했기 때문이다
   * (백로그 06 D8). 백필이 운영에서 확인되면 컬럼과 함께 이 줄도 사라진다.
   * 절대 "remove"로 바꾸지 않는다: 지금 지우면 되돌릴 원본이 없어진다.
   */
  const htmlIntent: HtmlIntent = { kind: "keep" };
  // 번들도 같은 구조 — 위젯이 보여줄 경로·파일명과 저장 의도를 따로 들고 있는다.
  const [bundlePath, setBundlePath] = useState(initial?.detailBundlePath ?? "");
  const [bundleName, setBundleName] = useState(initial?.detailBundleName ?? "");
  const [bundleIntent, setBundleIntent] = useState<BundleIntent>({ kind: "keep" });
  // 업로드가 끝나기 전에 저장하면 intent가 아직 "keep"이라 컬럼은 안 붙고,
  // 이미 올라간 파일 수십 개만 Storage에 고아로 남는다. 그동안 저장을 막는다.
  const [bundleUploading, setBundleUploading] = useState(false);
  // 지금 무엇이 들어 있는지로 초기값을 정한다. `detail_html`만 있는 옛 행은
  // **"없음"으로 보인다** — 공개 페이지가 그 값을 더 이상 읽지 않으므로
  // 실제로 상세 자료가 없는 상태가 맞다. 아래 안내 문구가 그 사실을 알린다.
  const [detailSource, setDetailSource] = useState<DetailSource>(
    initial?.detailBundlePath ? "bundle" : "none",
  );
  // 백필 전 옛 데이터인가 — 안내 문구를 띄울지 판단한다.
  const hasLegacyHtml =
    !initial?.detailBundlePath &&
    Boolean(initial?.detailHtmlRaw || initial?.detailHtml);
  const [pending, start] = useTransition();

  /**
   * 고르지 않은 쪽은 저장할 때 비운다. 라디오를 실제로 움직였을 때만 remove가
   * 되므로, 이름만 고쳐 저장하는 경우에는 양쪽 다 "keep"으로 남는다.
   */
  const changeDetailSource = (next: DetailSource) => {
    setDetailSource(next);
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
        <legend className="px-1 text-sm font-semibold text-ink/70">상세 자료</legend>
        <RadioField
          label="자료 방식"
          value={detailSource}
          onChange={changeDetailSource}
          options={DETAIL_SOURCE_OPTIONS}
        />
        <p className="text-xs font-medium text-ink/45">
          자료는 새 탭에서 원본 그대로 열립니다. 이미지·CSS가 딸린 자료는 zip으로,
          한 파일로 완결된 자료는 .html 한 장으로 올리면 됩니다.
        </p>

        {hasLegacyHtml && (
          <p role="alert" className="text-sm font-medium text-brand-yellow-ink">
            이 과정에는 옛 방식(페이지 안에 그리던 HTML)으로 올린 자료가 남아
            있습니다. 상세 페이지에는 더 이상 나오지 않습니다 — 같은 파일을
            위에서 다시 올려 주세요.
          </p>
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
