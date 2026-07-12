# KPOPSOFT Photography Placement Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 첨부 콜라주의 10개 장면을 독립 고화질 사진으로 만들어 관련 섹션에 분산 배치하고, 기존 강사 프로필 사진을 더 크게 활용한다.

**Architecture:** 사진 메타데이터를 `src/lib/photography.ts`에 모으고 공용 `EditorialPhoto` 컴포넌트가 `next/image` 최적화와 슬롯별 크롭을 담당한다. Company Introduction, Software, Education, Experts, B2B Education은 이 메타데이터만 소비하며 기존 CTA·교육 아코디언·문의 흐름은 그대로 유지한다.

**Tech Stack:** Next.js 16 App Router, React 19, TypeScript, Tailwind CSS 4, `next/image`, Node test runner, built-in ImageGen.

## Global Constraints

- 현재 브랜치는 `codex/kpopsoft-maxonomy-concept-wind`이며 병합하거나 푸시하지 않는다.
- 헤더의 기존 KPOPSOFT 로고, 브랜드 색상, 서체를 변경하지 않는다.
- 콜라주의 10개 장면을 모두 독립 자산으로 사용한다.
- 고화질 보정 중 원본의 인물, 화면, 공간, 로고, 문구를 새로 만들거나 바꾸지 않는다.
- 기존 교육 트랙, 아코디언, 상담 딥링크 동작을 유지한다.
- 모바일 390px, 태블릿 768px, 데스크톱 1440px에서 가로 넘침이 없어야 한다.
- 기존 강사 사진은 고해상도 원본 `public/experts/안영근02.png`, `public/experts/김상혁.png`를 사용한다.

---

### Task 1: 사진 메타데이터와 자산 계약

**Files:**
- Create: `src/lib/photography.ts`
- Create: `tests/photography-assets.test.mts`

**Interfaces:**
- Produces: `PhotographyAsset`, `photography`, `photographyAssets`
- Consumes: 프로젝트 `public/` 디렉터리와 기존 강사 이미지 경로

- [ ] **Step 1: 자산 계약 테스트 작성**

```ts
import assert from "node:assert/strict";
import { existsSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

import { photography, photographyAssets } from "../src/lib/photography.ts";

test("photography manifest exposes all ten approved scenes", () => {
  assert.equal(photographyAssets.length, 10);
  assert.deepEqual(Object.keys(photography), [
    "about",
    "software",
    "education",
    "b2b",
  ]);
});

test("every photography asset exists and has accessible copy", () => {
  for (const asset of photographyAssets) {
    assert.ok(existsSync(join(process.cwd(), "public", asset.src)));
    assert.ok(asset.alt.trim().length >= 10);
  }
});

test("approved high-resolution instructor portraits exist", () => {
  for (const src of ["experts/안영근02.png", "experts/김상혁.png"]) {
    assert.ok(existsSync(join(process.cwd(), "public", src)));
  }
});
```

- [ ] **Step 2: 테스트를 실행해 실패 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-assets.test.mts`

Expected: FAIL because `src/lib/photography.ts` does not exist.

- [ ] **Step 3: 사진 메타데이터 구현**

```ts
export type PhotographyAsset = {
  src: `/images/kpopsoft/${string}.jpg`;
  alt: string;
  position?: string;
};

export const photography = {
  about: {
    brandWall: {
      src: "/images/kpopsoft/about-brand-wall.jpg",
      alt: "햇살이 비치는 벽면에 설치된 KPOPSOFT 로고",
      position: "center",
    },
    headquarters: {
      src: "/images/kpopsoft/about-headquarters.jpg",
      alt: "나무와 유리 외벽이 어우러진 KPOPSOFT 사옥 전경",
      position: "center",
    },
  },
  software: {
    collaboration: {
      src: "/images/kpopsoft/software-collaboration.jpg",
      alt: "모니터의 코드를 함께 검토하는 KPOPSOFT 개발팀",
      position: "center",
    },
    dashboard: {
      src: "/images/kpopsoft/software-dashboard.jpg",
      alt: "노트북에서 데이터 대시보드를 개발하고 확인하는 장면",
      position: "center",
    },
    workstation: {
      src: "/images/kpopsoft/software-workstation.jpg",
      alt: "코드와 서비스 설계 화면이 열린 듀얼 모니터 개발 환경",
      position: "center",
    },
    sketch: {
      src: "/images/kpopsoft/software-sketch.jpg",
      alt: "노트에 서비스 화면과 흐름을 직접 설계하는 장면",
      position: "center",
    },
  },
  education: {
    workshop: {
      src: "/images/kpopsoft/education-workshop.jpg",
      alt: "화면의 서비스 구조를 보며 진행하는 소규모 실무 교육",
      position: "center",
    },
    classroom: {
      src: "/images/kpopsoft/education-classroom.jpg",
      alt: "수강생들이 노트북으로 참여하는 KPOPSOFT 강의 현장",
      position: "center",
    },
  },
  b2b: {
    lounge: {
      src: "/images/kpopsoft/b2b-lounge.jpg",
      alt: "라운지에서 프로젝트를 논의하는 KPOPSOFT 팀",
      position: "center",
    },
    meetingRoom: {
      src: "/images/kpopsoft/b2b-meeting-room.jpg",
      alt: "유리 회의실에서 노트북을 펼치고 협업하는 팀",
      position: "center",
    },
  },
} as const satisfies Record<string, Record<string, PhotographyAsset>>;

export const photographyAssets = Object.values(photography).flatMap((group) =>
  Object.values(group),
);
```

- [ ] **Step 4: 메타데이터 테스트 상태 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-assets.test.mts`

Expected: module import succeeds; asset-existence assertions fail until Task 2 completes.

- [ ] **Step 5: 계약 코드 커밋**

```bash
git add src/lib/photography.ts tests/photography-assets.test.mts
git commit -m "test: define photography asset contract"
```

### Task 2: 콜라주 장면 10개 분리와 고화질 보정

**Files:**
- Create: `public/images/kpopsoft/about-brand-wall.jpg`
- Create: `public/images/kpopsoft/about-headquarters.jpg`
- Create: `public/images/kpopsoft/software-collaboration.jpg`
- Create: `public/images/kpopsoft/software-dashboard.jpg`
- Create: `public/images/kpopsoft/software-workstation.jpg`
- Create: `public/images/kpopsoft/software-sketch.jpg`
- Create: `public/images/kpopsoft/education-workshop.jpg`
- Create: `public/images/kpopsoft/education-classroom.jpg`
- Create: `public/images/kpopsoft/b2b-lounge.jpg`
- Create: `public/images/kpopsoft/b2b-meeting-room.jpg`

**Interfaces:**
- Consumes: `/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 12일 오후 05_30_04.png` as the sole edit target
- Produces: ten standalone JPEG assets referenced by `photography`

- [ ] **Step 1: built-in ImageGen으로 각 패널을 독립 편집**

각 호출에서 원본 이미지를 edit target으로 사용하고 아래 공통 제약을 포함한다.

```text
Use case: precise-object-edit
Asset type: responsive KPOPSOFT website editorial photography
Primary request: Extract only the specified panel from the supplied 3-row collage and upscale it into a clean standalone landscape photograph.
Constraints: preserve the original panel exactly; keep every person, face, pose, device, screen, room, lighting, logo and visible text unchanged; remove only the surrounding white gutters and neighboring panels; no new people, objects, text or watermark; no stylization; natural photographic detail; high-resolution web output.
```

패널별 지정은 다음과 같다.

1. middle row left → `about-brand-wall.jpg`
2. bottom row second → `about-headquarters.jpg`
3. top row left → `software-collaboration.jpg`
4. top row middle → `software-dashboard.jpg`
5. middle row right → `software-workstation.jpg`
6. bottom row third → `software-sketch.jpg`
7. top row right → `education-workshop.jpg`
8. bottom row left → `education-classroom.jpg`
9. middle row middle → `b2b-lounge.jpg`
10. bottom row right → `b2b-meeting-room.jpg`

- [ ] **Step 2: 생성 결과를 프로젝트로 이동하고 원본 불변성 확인**

각 선택 결과를 `public/images/kpopsoft/`의 지정 파일명으로 이동한다. 로고 장면은 `KPOPSOFT` 글자와 파랑 원·빨강 별·민트 웨이브가 원본과 같은지 원본과 나란히 확인한다. 사람의 수와 얼굴, 발표 화면, 모니터 UI도 원본 패널과 비교한다.

- [ ] **Step 3: 크기와 형식 확인**

Run: `sips -g pixelWidth -g pixelHeight -g format public/images/kpopsoft/*`

Expected: ten readable JPEG files; every long edge is at least 1200px.

- [ ] **Step 4: 자산 계약 테스트 통과 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-assets.test.mts`

Expected: PASS.

- [ ] **Step 5: 이미지 자산 커밋**

```bash
git add public/images/kpopsoft
git commit -m "assets: add KPOPSOFT editorial photography"
```

### Task 3: 공용 편집형 사진 컴포넌트

**Files:**
- Create: `src/components/ui/editorial-photo.tsx`
- Create: `tests/editorial-photo-contract.test.mts`

**Interfaces:**
- Consumes: `PhotographyAsset`
- Produces: `EditorialPhoto({ asset, sizes, className, imageClassName, priority })`

- [ ] **Step 1: 공용 컴포넌트 계약 테스트 작성**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const source = readFileSync(
  join(process.cwd(), "src/components/ui/editorial-photo.tsx"),
  "utf8",
);

test("editorial photo uses Next Image with responsive sizing", () => {
  assert.match(source, /from "next\/image"/);
  assert.match(source, /sizes=/);
  assert.match(source, /asset\.alt/);
  assert.match(source, /object-cover/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/editorial-photo-contract.test.mts`

Expected: FAIL because the component does not exist.

- [ ] **Step 3: 공용 컴포넌트 구현**

```tsx
import Image from "next/image";

import type { PhotographyAsset } from "@/lib/photography";
import { cn } from "@/lib/utils";

type EditorialPhotoProps = {
  asset: PhotographyAsset;
  sizes: string;
  className?: string;
  imageClassName?: string;
  priority?: boolean;
};

export function EditorialPhoto({
  asset,
  sizes,
  className,
  imageClassName,
  priority = false,
}: EditorialPhotoProps) {
  return (
    <figure
      className={cn(
        "relative overflow-hidden rounded-3xl bg-ink/5",
        className,
      )}
    >
      <Image
        src={asset.src}
        alt={asset.alt}
        fill
        sizes={sizes}
        priority={priority}
        className={cn("object-cover", imageClassName)}
        style={{ objectPosition: asset.position ?? "center" }}
      />
    </figure>
  );
}
```

- [ ] **Step 4: 테스트와 린트 통과 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/editorial-photo-contract.test.mts && npm run lint`

Expected: PASS and no ESLint errors.

- [ ] **Step 5: 공용 컴포넌트 커밋**

```bash
git add src/components/ui/editorial-photo.tsx tests/editorial-photo-contract.test.mts
git commit -m "feat: add responsive editorial photo component"
```

### Task 4: Company Introduction과 Software 사진 배치

**Files:**
- Modify: `src/components/sections/company-introduction.tsx`
- Modify: `src/components/sections/software.tsx`
- Create: `tests/photography-section-contract.test.mts`

**Interfaces:**
- Consumes: `EditorialPhoto`, `photography.about`, `photography.software`
- Produces: 회사 소개 2장 배치와 Software 4장 제작 과정 스트립

- [ ] **Step 1: 섹션 참조 테스트 작성**

```ts
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { join } from "node:path";
import test from "node:test";

const read = (name: string) =>
  readFileSync(join(process.cwd(), "src/components/sections", name), "utf8");

test("company introduction uses both approved company images", () => {
  const source = read("company-introduction.tsx");
  assert.match(source, /photography\.about\.brandWall/);
  assert.match(source, /photography\.about\.headquarters/);
});

test("software uses all four approved making-process images", () => {
  const source = read("software.tsx");
  for (const key of ["collaboration", "dashboard", "workstation", "sketch"]) {
    assert.match(source, new RegExp(`photography\\.software\\.${key}`));
  }
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-section-contract.test.mts`

Expected: FAIL because the section files do not reference photography.

- [ ] **Step 3: Company Introduction 배치 구현**

소개 문구 그리드 뒤에 다음 구조를 추가한다.

```tsx
<div className="mt-14 grid gap-4 lg:mt-20 lg:grid-cols-12">
  <EditorialPhoto
    asset={photography.about.brandWall}
    sizes="(min-width: 1024px) 58vw, 100vw"
    className="aspect-[16/10] lg:col-span-7"
  />
  <EditorialPhoto
    asset={photography.about.headquarters}
    sizes="(min-width: 1024px) 42vw, 100vw"
    className="aspect-[4/3] lg:col-span-5 lg:aspect-auto"
  />
</div>
```

- [ ] **Step 4: Software 제작 과정 스트립 구현**

기존 서비스 카드 그리드 뒤에 `현장에서 만드는 과정` 레이블과 12열 이미지 그리드를 추가한다. `collaboration`은 `lg:col-span-7 lg:row-span-2`, 나머지는 5열 보조 슬롯으로 배치하고 모바일에서는 모두 한 열로 보여준다.

- [ ] **Step 5: 계약 테스트와 린트 통과 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-section-contract.test.mts && npm run lint`

Expected: PASS and no ESLint errors.

- [ ] **Step 6: 두 섹션 커밋**

```bash
git add src/components/sections/company-introduction.tsx src/components/sections/software.tsx tests/photography-section-contract.test.mts
git commit -m "feat: add company and software photography"
```

### Task 5: Education, Experts, B2B Education 사진 배치

**Files:**
- Modify: `src/components/sections/education.tsx`
- Modify: `src/components/sections/experts.tsx`
- Modify: `src/components/sections/b2b-education.tsx`
- Modify: `src/lib/site.ts`
- Modify: `tests/photography-section-contract.test.mts`

**Interfaces:**
- Consumes: `photography.education`, `photography.b2b`, high-resolution expert image paths
- Produces: 교육 현장 2장, 확대된 강사 초상, B2B 협업 2장

- [ ] **Step 1: 나머지 섹션 계약 테스트 추가**

```ts
test("education and B2B use all approved photography", () => {
  const education = read("education.tsx");
  const b2b = read("b2b-education.tsx");
  assert.match(education, /photography\.education\.workshop/);
  assert.match(education, /photography\.education\.classroom/);
  assert.match(b2b, /photography\.b2b\.lounge/);
  assert.match(b2b, /photography\.b2b\.meetingRoom/);
});

test("experts use the approved high-resolution portraits", () => {
  const site = readFileSync(join(process.cwd(), "src/lib/site.ts"), "utf8");
  assert.match(site, /\/experts\/안영근02\.png/);
  assert.match(site, /\/experts\/김상혁\.png/);
});
```

- [ ] **Step 2: 테스트 실패 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-section-contract.test.mts`

Expected: FAIL on missing Education, B2B and portrait references.

- [ ] **Step 3: Education 사진 프리뷰 구현**

헤딩과 아코디언 사이에 12열 그리드를 추가한다. `workshop`은 8열 16:9, `classroom`은 4열 4:3으로 두고 아코디언의 기존 상단 여백을 줄여 사진과 트랙 목록이 하나의 흐름으로 읽히게 한다.

- [ ] **Step 4: 강사 고해상도 사진과 크기 적용**

`site.ts`의 두 이미지 경로를 다음과 같이 변경한다.

```ts
image: "/experts/안영근02.png"
image: "/experts/김상혁.png"
```

Experts의 초상 컨테이너를 `aspect-[4/5] w-full max-w-64 sm:max-w-72 lg:w-72`로 키우고 모바일에서도 인용문보다 먼저 안정적으로 보이게 한다. 사진이 없는 강사의 모노그램 경로는 유지한다.

- [ ] **Step 5: B2B 패널 2열 사진 구성 구현**

네이비 패널 내부를 `lg:grid-cols-12`로 바꾸고 기존 문구 영역은 7열, 사진 영역은 5열로 둔다. 오른쪽 사진 영역은 `lounge` 16:10과 `meetingRoom` 16:9를 세로로 배치한다. 모바일에서는 CTA 다음에 사진이 이어진다.

- [ ] **Step 6: 전체 섹션 계약과 기존 교육 테스트 확인**

Run: `node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test tests/photography-section-contract.test.mts tests/education-section-contract.test.mts tests/education-tracks.test.mts`

Expected: PASS.

- [ ] **Step 7: 섹션 구현 커밋**

```bash
git add src/components/sections/education.tsx src/components/sections/experts.tsx src/components/sections/b2b-education.tsx src/lib/site.ts tests/photography-section-contract.test.mts
git commit -m "feat: distribute photography across education sections"
```

### Task 6: 문서 동기화와 전체 검증

**Files:**
- Modify: `docs/개발상태.md`
- Modify: `docs/디자인.md`

**Interfaces:**
- Consumes: 완료된 사진 자산과 섹션 구현
- Produces: 최신 구현 상태 문서와 검증 증거

- [ ] **Step 1: 문서 업데이트**

`docs/개발상태.md`에 10개 고화질 사진의 맥락별 분산 배치와 고해상도 강사 사진 적용을 추가한다. `docs/디자인.md`에는 Company 7:5, Software lead-plus-supporting, Education 8:4, B2B 7:5의 사진 레이아웃 규칙을 추가한다.

- [ ] **Step 2: 전체 자동 검증**

Run: `npm test && npm run lint && npm run build && git diff --check`

Expected: all tests pass, ESLint exits 0, Next.js production build exits 0, diff check has no output.

- [ ] **Step 3: Chrome 반응형 검증**

The flow under test is: `/` → Company Introduction → Software → Education accordion → Experts → B2B Education → track consultation CTA.

Chrome에서 1440×1000, 768×1024, 390×844를 확인한다. 각 화면에서 가로 넘침, 잘린 얼굴·로고, 지나치게 늘어난 이미지, 텍스트 대비, CTA 가시성, 아코디언 전환, 상담 폼의 교육 유형 자동 선택을 확인한다. 콘솔 error/warn과 Next.js 오류 오버레이가 없어야 한다.

- [ ] **Step 4: 문서 커밋**

```bash
git add docs/개발상태.md docs/디자인.md
git commit -m "docs: record photography layout"
```

- [ ] **Step 5: 브랜치 유지 상태 보고**

현재 브랜치와 작업공간을 유지하며 merge, push, PR, cleanup을 실행하지 않는다.
