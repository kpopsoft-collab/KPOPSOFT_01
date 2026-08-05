/**
 * 포트폴리오 3분류 필터 (docs/02-home/ §SECTION 05).
 *
 * Work 레코드에는 아직 3분류 컬럼이 없다 — 지금 있는 건 `category`라는 자유
 * 문자열("Internal Tools · AI Automation" 같은)뿐이고, 컬럼 추가는 DB/Admin
 * 작업이라 이번 범위 밖이다. 그래서 그 문자열에서 분류를 **파생**한다.
 *
 * 파생이므로 정확도의 상한이 있다. Admin에서 3분류를 직접 고르게 되면 이
 * 파일은 통째로 그 필드를 읽는 것으로 바뀐다 — 그때까지의 임시 다리다.
 *
 * 하나의 사례가 여러 분류에 속할 수 있다(ver3 §05: "한 사례가 두 분류에 동시
 * 소속 가능"). "Web · Education"은 소프트웨어이면서 교육이다.
 */

/** 홈 포트폴리오 필터가 쓰는 분류. 교육 3분류와 다른 축이다. */
export type WorkCategoryId = "software" | "ai" | "education";

export const workCategories: { id: WorkCategoryId; label: string }[] = [
  { id: "software", label: "소프트웨어" },
  { id: "ai", label: "AI 솔루션" },
  { id: "education", label: "교육" },
];

/**
 * 분류별 키워드. `category` 문자열에 대소문자 구분 없이 하나라도 걸리면
 * 그 분류로 친다.
 */
const KEYWORDS: Record<WorkCategoryId, string[]> = {
  education: ["education", "교육", "training", "class", "워크숍", "workshop"],
  ai: ["ai", "automation", "자동화", "chatbot", "챗봇", "agent", "llm"],
  software: [
    "web",
    "app",
    "웹",
    "앱",
    "admin",
    "어드민",
    "internal tools",
    "digital product",
    "platform",
    "prototype",
    "mvp",
    "software",
  ],
};

/* ------------------------------------------------------------------ *
 * 사례 → 문의 폼 사전 선택
 * ------------------------------------------------------------------ */

/** 문의 폼 딥링크 대상. `/?ct=<유형>&cs=<세부 유형>#contact` 로 넘긴다. */
export type InquiryTarget = { ct: string; cs: string };

/** 문의 옵션의 최소 형태 — `PublicInquiryOption`과 구조가 같다. */
type OptionLike = {
  type: string;
  subtypes: readonly { label: string }[];
};

/**
 * 사례에 어울리는 세부 유형을 찾기 위한 키워드. 앞에 있을수록 우선한다.
 * 사례의 `category`와 `title`을 함께 본다 — "AI Solutions"만으로는 챗봇인지
 * 자동화인지 알 수 없기 때문이다.
 */
function subtypeKeywordsFor(category: string, title: string): string[] {
  const text = `${category} ${title}`.toLowerCase();

  if (/admin|어드민|internal tools|관리자|대시보드/.test(text)) {
    return ["어드민", "관리자", "내부 운영", "웹"];
  }
  if (/챗봇|chatbot|비서|assistant/.test(text)) return ["챗봇"];
  if (/자동화|automation|workflow/.test(text)) return ["자동화"];
  if (/\bapp\b|앱|모바일|mobile/.test(text)) return ["앱"];
  if (/web|웹|랜딩|landing|사이트/.test(text)) return ["웹"];
  return [];
}

/**
 * 사례 상세의 "이런 프로젝트, 함께 만들기"가 향할 문의 폼 상태.
 *
 * 라벨을 코드에 박지 않고 **실제 문의 옵션에서 찾아 맞춘다** — 유형/세부 유형은
 * DB(`inquiry_types`/`inquiry_subtypes`)에서 오고 Admin에서 바뀔 수 있어서,
 * 하드코딩하면 라벨이 바뀌는 순간 조용히 어긋난다. 키워드로 찾으면 라벨이
 * 조금 달라져도 계속 맞는다.
 *
 * 교육 유형은 제외한다 — 홈 폼에서 교육은 라디오가 아니라 `/education`으로
 * 가는 링크라, 사전 선택할 대상이 아니다.
 */
export function inquiryTargetFor(
  item: { category: string; title: string },
  options: readonly OptionLike[],
  educationTypeLabel = "교육 문의",
): InquiryTarget | null {
  const candidates = options.filter((o) => o.type !== educationTypeLabel);

  for (const keyword of subtypeKeywordsFor(item.category, item.title)) {
    for (const option of candidates) {
      const matched = option.subtypes.find((s) => s.label.includes(keyword));
      if (matched) return { ct: option.type, cs: matched.label };
    }
  }
  return null;
}

/**
 * 한 사례가 속한 분류들.
 *
 * 어디에도 걸리지 않으면 `software`로 떨어뜨린다 — KPOPSOFT가 만드는 것의
 * 기본값이 소프트웨어이고, 분류 미상인 사례가 필터에서 통째로 사라지는 것보다
 * 낫기 때문이다.
 */
export function getWorkCategories(category: string): WorkCategoryId[] {
  const haystack = category.toLowerCase();

  const matched = workCategories
    .map((c) => c.id)
    .filter((id) => KEYWORDS[id].some((kw) => haystack.includes(kw)));

  return matched.length > 0 ? matched : ["software"];
}
