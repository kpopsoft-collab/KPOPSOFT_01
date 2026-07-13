# KPOPSOFT Nine-Photo Refresh Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** 새 원본 사진 9장을 중복 없이 Company, Software, Education, B2B에 배치하고 기존 강사 사진과 모든 상호작용을 보존한다.

**Architecture:** 기존 `EditorialPhoto` 컴포넌트와 섹션 구조는 유지하고, `src/lib/photography.ts`를 새 9장 자산의 단일 매니페스트로 갱신한다. 회사 소개만 두 장 그리드에서 한 장 대표 사진으로 축소하며, Education과 B2B는 주·보조 사진 순서를 승인된 의미에 맞게 조정한다.

**Tech Stack:** Next.js 16.2.10 App Router, React 19, TypeScript, Tailwind CSS 4, `next/image`, Node test runner, macOS `sips`

## Global Constraints

- 새 사진 9장은 중복 없이 정확히 한 번씩 사용한다.
- 기존 KPOPSOFT 헤더 로고, 브랜드 색상, 서체와 강사 프로필 사진은 변경하지 않는다.
- AI 재생성이나 생성형 업스케일을 사용하지 않는다.
- 1448px 원본은 확대하지 않고, 1672px 원본만 긴 변 1600px로 축소한다.
- JPEG 품질은 92로 유지한다.
- 교육 아코디언, 문의 딥링크, B2B CTA와 모바일 DOM 순서를 유지한다.
- 현재 브랜치 `codex/kpopsoft-maxonomy-concept-wind`를 유지하고 병합·푸시하지 않는다.
- `next/image` 변경이 필요하면 `node_modules/next/dist/docs/01-app/03-api-reference/02-components/image.md`의 Next.js 16.2.10 계약을 따른다.

---

## File Structure

- `public/images/kpopsoft/*.jpg`: 제공받은 PNG를 충실하게 변환한 9개 웹 사진 자산.
- `src/lib/photography.ts`: 사진 경로, 실제 장면을 설명하는 대체 텍스트와 초점 위치의 단일 소스.
- `src/components/sections/company-introduction.tsx`: 회사 소개의 단일 대표 사진 레이아웃.
- `src/components/sections/education.tsx`: 강의실 주 사진과 멘토링 보조 사진 순서.
- `src/components/sections/b2b-education.tsx`: 회의실 워크숍 주 사진과 라운지 보조 사진 순서.
- `tests/photography-assets.test.mts`: 9개 자산의 개수, 고유성, 파일과 대체 텍스트 계약.
- `tests/photography-section-contract.test.mts`: 섹션별 사진 키와 기존 강사 사진 보존 계약.
- `docs/개발상태.md`, `docs/디자인.md`: 실제 구현된 9장 배치와 단일 회사 대표 사진 규칙.

---

### Task 1: 9장 자산·섹션 계약을 테스트로 고정

**Files:**
- Modify: `tests/photography-assets.test.mts:7-22`
- Modify: `tests/photography-section-contract.test.mts:9-14`

**Interfaces:**
- Consumes: `photographyAssets: readonly PhotographyAsset[]`, `photography.about.officeCulture`
- Produces: 9개 고유 자산과 회사 소개 단일 사진을 강제하는 회귀 테스트

- [ ] **Step 1: 자산 계약 테스트를 9장 기준으로 변경**

`tests/photography-assets.test.mts`의 첫 테스트를 다음 코드로 바꾼다.

```ts
test("photography manifest exposes nine unique approved scenes", () => {
  assert.equal(photographyAssets.length, 9);
  assert.equal(new Set(photographyAssets.map((asset) => asset.src)).size, 9);
  assert.deepEqual(Object.keys(photography), [
    "about",
    "software",
    "education",
    "b2b",
  ]);
  assert.deepEqual(Object.keys(photography.about), ["officeCulture"]);
});
```

- [ ] **Step 2: 회사 소개 섹션 계약을 단일 사진 기준으로 변경**

`tests/photography-section-contract.test.mts`의 회사 소개 테스트를 다음 코드로 바꾼다.

```ts
test("company introduction uses the approved office culture image once", () => {
  const source = read("company-introduction.tsx");
  assert.match(source, /photography\.about\.officeCulture/);
  assert.doesNotMatch(source, /photography\.about\.(brandWall|headquarters)/);
});
```

- [ ] **Step 3: 변경된 계약이 현재 구현에서 실패하는지 확인**

Run:

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="photography manifest|company introduction" tests/*.test.mts
```

Expected: FAIL. 현재 매니페스트는 10개이고 회사 소개는 `brandWall`, `headquarters`를 참조한다.

- [ ] **Step 4: 테스트 계약 커밋**

```bash
git add tests/photography-assets.test.mts tests/photography-section-contract.test.mts
git commit -m "test: define nine-photo refresh contract"
```

---

### Task 2: 새 사진 9장 변환과 매니페스트 갱신

**Files:**
- Create: `public/images/kpopsoft/about-office-culture.jpg`
- Replace: `public/images/kpopsoft/software-collaboration.jpg`
- Replace: `public/images/kpopsoft/software-dashboard.jpg`
- Replace: `public/images/kpopsoft/software-workstation.jpg`
- Replace: `public/images/kpopsoft/software-sketch.jpg`
- Replace: `public/images/kpopsoft/education-classroom.jpg`
- Replace: `public/images/kpopsoft/education-workshop.jpg`
- Replace: `public/images/kpopsoft/b2b-lounge.jpg`
- Replace: `public/images/kpopsoft/b2b-meeting-room.jpg`
- Delete: `public/images/kpopsoft/about-brand-wall.jpg`
- Delete: `public/images/kpopsoft/about-headquarters.jpg`
- Modify: `src/lib/photography.ts:7-65`
- Modify: `src/components/sections/company-introduction.tsx:62-73`

**Interfaces:**
- Consumes: 9개 PNG 원본과 `PhotographyAsset` 타입
- Produces: `photography.about.officeCulture` 및 기존 Software/Education/B2B 키를 포함하는 9개 자산 매니페스트와 빌드 가능한 회사 대표 사진 레이아웃

- [ ] **Step 1: 원본을 JPEG 품질 92로 충실하게 변환**

첫 번째 1672px 사진만 1600px로 축소하고, 나머지 1448px 사진은 크기를 유지한다.

```bash
sips -Z 1600 -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_07 (1).png" --out public/images/kpopsoft/software-collaboration.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_07 (2).png" --out public/images/kpopsoft/software-dashboard.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_08 (3).png" --out public/images/kpopsoft/education-classroom.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_11 (4).png" --out public/images/kpopsoft/b2b-lounge.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_12 (6).png" --out public/images/kpopsoft/b2b-meeting-room.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_13 (7).png" --out public/images/kpopsoft/software-sketch.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_11 (5).png" --out public/images/kpopsoft/software-workstation.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_15 (8).png" --out public/images/kpopsoft/about-office-culture.jpg
sips -s format jpeg -s formatOptions 92 "/Users/mac-mini/Downloads/ChatGPT Image 2026년 7월 13일 오전 09_50_16 (9).png" --out public/images/kpopsoft/education-workshop.jpg
rm public/images/kpopsoft/about-brand-wall.jpg public/images/kpopsoft/about-headquarters.jpg
```

- [ ] **Step 2: 매니페스트를 실제 장면 기준으로 갱신**

`src/lib/photography.ts`의 `photography` 객체를 다음 값으로 바꾼다.

```ts
export const photography = {
  about: {
    officeCulture: {
      src: "/images/kpopsoft/about-office-culture.jpg",
      alt: "여러 팀이 테이블에 모여 협업하는 밝은 오픈 오피스",
      position: "center",
    },
  },
  software: {
    collaboration: {
      src: "/images/kpopsoft/software-collaboration.jpg",
      alt: "회의실에서 대형 화면의 서비스 흐름을 설명하고 함께 검토하는 모습",
      position: "center",
    },
    dashboard: {
      src: "/images/kpopsoft/software-dashboard.jpg",
      alt: "AI 워크플로 대시보드가 열린 노트북으로 작업하는 모습",
      position: "center",
    },
    workstation: {
      src: "/images/kpopsoft/software-workstation.jpg",
      alt: "코드와 모바일 화면 설계가 열린 듀얼 모니터 개발 환경",
      position: "center",
    },
    sketch: {
      src: "/images/kpopsoft/software-sketch.jpg",
      alt: "노트에 모바일 대시보드와 화면 흐름을 스케치하는 모습",
      position: "center",
    },
  },
  education: {
    workshop: {
      src: "/images/kpopsoft/education-workshop.jpg",
      alt: "노트북 화면을 함께 보며 실습 내용을 설명하는 소규모 멘토링",
      position: "center",
    },
    classroom: {
      src: "/images/kpopsoft/education-classroom.jpg",
      alt: "수강생들이 노트북으로 AI 워크플로 강의를 듣는 강의실",
      position: "center",
    },
  },
  b2b: {
    lounge: {
      src: "/images/kpopsoft/b2b-lounge.jpg",
      alt: "라운지에서 네 명이 노트북과 메모를 두고 대화하는 모습",
      position: "center",
    },
    meetingRoom: {
      src: "/images/kpopsoft/b2b-meeting-room.jpg",
      alt: "화이트보드의 사용자 흐름을 함께 검토하는 팀 워크숍",
      position: "center",
    },
  },
} as const satisfies Record<string, Record<string, PhotographyAsset>>;
```

- [ ] **Step 3: 회사 소개를 단일 대표 사진으로 변경**

`company-introduction.tsx`의 기존 사진 그리드를 다음 코드로 바꾼다.

```tsx
<div className="mt-14 lg:mt-20">
  <EditorialPhoto
    asset={photography.about.officeCulture}
    sizes="(min-width: 1440px) 1280px, 100vw"
    className="aspect-[4/3] md:aspect-video"
  />
</div>
```

- [ ] **Step 4: 자산 크기와 초점이 원본과 일치하는지 확인**

```bash
for file in public/images/kpopsoft/*.jpg; do
  sips -g pixelWidth -g pixelHeight "$file" 2>/dev/null | tr '\n' ' '
  echo
done
```

Expected: `software-collaboration.jpg`의 긴 변은 1600px, 나머지 8장은 1448×1086px이며 총 9개다.

- [ ] **Step 5: 자산과 회사 소개 계약 테스트 통과 확인**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="photography manifest|every photography asset|company introduction" tests/*.test.mts
```

Expected: PASS.

- [ ] **Step 6: 자산, 매니페스트와 회사 소개 커밋**

```bash
git add public/images/kpopsoft src/lib/photography.ts src/components/sections/company-introduction.tsx
git commit -m "assets: replace editorial photography"
```

---

### Task 3: 승인된 1·4·2·2 사진 레이아웃 적용

**Files:**
- Modify: `src/components/sections/education.tsx:42-52`
- Modify: `src/components/sections/b2b-education.tsx:52-62`
- Modify: `docs/개발상태.md:12`
- Modify: `docs/디자인.md:680`
- Modify: `tests/photography-section-contract.test.mts`

**Interfaces:**
- Consumes: `photography.education.classroom`, `photography.education.workshop`, `photography.b2b.meetingRoom`, `photography.b2b.lounge`
- Produces: 회사 1장, Software 4장, Education 2장, B2B 2장의 반응형 화면

- [ ] **Step 1: 주·보조 사진 순서의 실패 테스트 추가**

`tests/photography-section-contract.test.mts`에 다음 테스트를 추가한다.

```ts
test("education and B2B place the approved lead image first", () => {
  const education = read("education.tsx");
  const b2b = read("b2b-education.tsx");

  assert.ok(
    education.indexOf("photography.education.classroom") <
      education.indexOf("photography.education.workshop"),
  );
  assert.ok(
    b2b.indexOf("photography.b2b.meetingRoom") <
      b2b.indexOf("photography.b2b.lounge"),
  );
});
```

- [ ] **Step 2: 새 순서 계약이 현재 구현에서 실패하는지 확인**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="approved lead image first" tests/photography-section-contract.test.mts
```

Expected: FAIL. 현재 Education은 `workshop`이 먼저이고 B2B는 `lounge`가 먼저다.

- [ ] **Step 3: Education의 강의실을 주 사진으로 배치**

`education.tsx`의 사진 두 장 순서를 다음과 같이 바꾼다.

```tsx
<EditorialPhoto
  asset={photography.education.classroom}
  sizes="(min-width: 1024px) 66vw, 100vw"
  className="aspect-video lg:col-span-8"
/>
<EditorialPhoto
  asset={photography.education.workshop}
  sizes="(min-width: 1024px) 34vw, 100vw"
  className="aspect-[4/3] lg:col-span-4"
/>
```

- [ ] **Step 4: B2B의 회의실 워크숍을 주 사진으로 배치**

`b2b-education.tsx`의 사진 두 장 순서를 다음과 같이 바꾼다.

```tsx
<EditorialPhoto
  asset={photography.b2b.meetingRoom}
  sizes="(min-width: 1024px) 34vw, 100vw"
  className="aspect-[16/10]"
/>
<EditorialPhoto
  asset={photography.b2b.lounge}
  sizes="(min-width: 1024px) 34vw, 100vw"
  className="aspect-video"
/>
```

- [ ] **Step 5: 구현 문서를 실제 9장 구조와 일치시킴**

`docs/개발상태.md`의 사진 상태를 다음 문장으로 바꾼다.

```md
- 9개의 고화질 사진을 Company 1장, Software 4장, Education 2장, B2B 2장으로 분산 배치했으며, Experts에는 기존 고해상도 강사 사진을 유지했습니다.
```

`docs/디자인.md`의 Company 사진 규칙을 다음 문장으로 바꾼다.

```md
- 사진 영역은 여러 팀이 협업하는 오픈 오피스 대표 사진 한 장을 넓게 배치해 회사의 업무 문화를 보여준다.
```

- [ ] **Step 6: 섹션 계약과 전체 사진 테스트 통과 확인**

```bash
node --disable-warning=MODULE_TYPELESS_PACKAGE_JSON --test --test-name-pattern="company introduction|software uses|education and B2B|experts use|photography manifest" tests/*.test.mts
```

Expected: PASS.

- [ ] **Step 7: 레이아웃, 테스트와 문서 커밋**

```bash
git add src/components/sections/education.tsx src/components/sections/b2b-education.tsx tests/photography-section-contract.test.mts docs/개발상태.md docs/디자인.md
git commit -m "feat: apply nine-photo editorial layout"
```

---

### Task 4: 전체 검증과 반응형 브라우저 QA

**Files:**
- Verify: `public/images/kpopsoft/*.jpg`
- Verify: `src/lib/photography.ts`
- Verify: `src/components/sections/*.tsx`
- Verify: `tests/*.test.mts`

**Interfaces:**
- Consumes: Tasks 1-3의 커밋된 9장 구현
- Produces: 병합·푸시 없이 검증된 로컬 브랜치

- [ ] **Step 1: 정적 검증 전체 실행**

```bash
npm test && npm run lint && npm run build
```

Expected: 모든 테스트 PASS, ESLint 오류 0개, Next.js 16.2.10 프로덕션 빌드 exit 0.

- [ ] **Step 2: 브랜치 범위 공백 오류와 작업트리 확인**

```bash
BASE=$(git merge-base main HEAD)
git diff --check "$BASE"..HEAD
git status --short
```

Expected: 두 명령 모두 출력 없음.

- [ ] **Step 3: Chrome에서 반응형 화면 확인**

`npm run dev`로 로컬 서버를 실행하고 390×844, 768×1024, 1440×1000에서 다음을 확인한다.

- Company 대표 사진이 한 번만 표시되고 얼굴과 앞·뒤 협업 그룹이 자연스럽게 보인다.
- Software 네 장의 사진이 중복 없이 표시된다.
- Education에서 강의실이 주 사진, 멘토링이 보조 사진이다.
- B2B에서 화이트보드 워크숍이 주 사진, 라운지 대화가 보조 사진이다.
- Experts의 안영근·김상혁 사진이 유지된다.
- 가로 넘침과 콘솔 오류가 없다.

- [ ] **Step 4: 상호작용 회귀 확인**

- 첫 교육 트랙이 열려 있고 다른 트랙을 열고 닫을 수 있다.
- 교육 CTA로 문의 섹션에 이동하면 해당 교육 유형이 자동 선택된다.
- B2B CTA가 `교육 문의`와 `기업 맞춤·프로젝트`를 유지한다.

- [ ] **Step 5: 최종 상태 기록**

```bash
git log --oneline -6
git status --short --branch
```

Expected: 현재 브랜치가 `codex/kpopsoft-maxonomy-concept-wind`이고 작업트리가 깨끗하며 원격 푸시는 수행하지 않았다.
