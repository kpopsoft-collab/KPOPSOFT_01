# KPOPSOFT 이미지 생성용 프롬프트

이 문서는 KPOPSOFT 사이트의 새 사례·프로그램 이미지를 생성할 때 바로 복사해 사용할 수 있는 프롬프트 모음이다. 2026년 8월 2일 Codex 이미지 생성 작업의 최종 에셋과 프롬프트를 기준으로 작성했다. 이후 같은 영역에 사례나 과정이 추가되면 이 문서의 규격과 프롬프트를 복사한 뒤 `Primary request`, `Subject`, `Text`, 실제 참조 이미지만 새 콘텐츠에 맞게 변경한다.

## 1. 공통 원칙

- 생성 방식: Codex 내장 `image_gen` 도구
- 기본 배경: 따뜻한 아이보리 `#F6F1EA`
- Software 포인트: 블루 `#315BDB`, 네이비, 스카이블루, 민트
- AI Solutions 포인트: 코랄·레드, 네이비, 민트, 블루
- Education 포인트: 블루 `#315BDB`, 스카이블루 `#72A3E8`, 민트 `#63C7B2`, 옐로 `#FFC85C`
- UI는 실제로 구현 가능한 수준의 고해상도 제품 목업으로 표현한다.
- 인물보다 결과물과 인터페이스가 먼저 읽혀야 한다.
- 임의의 회사명, 성과 수치, 고객 후기, 로고를 만들지 않는다.
- 실사례는 제공된 실제 화면을 보존하고, 가상 사례는 `CONCEPT EXAMPLE` 또는 설명 문구로 실제 납품 사례처럼 오해되지 않게 한다.
- 작은 카드에서도 주제가 읽히도록 핵심 UI와 장치를 크게 배치한다.
- 과도한 글래스모피즘, 네온, 사이버펑크, 강한 그라디언트, 광택 3D 장식, 복잡한 배경은 피한다.
- 생성 이미지 안의 문구는 짧게 제한한다. 긴 한국어 본문은 이미지 모델이 왜곡할 가능성이 높다.

## 2. 규격과 파일 관리

| 사용 영역 | 권장 비율 | 현재 출력 규격 | 파일 형식 |
| --- | --- | --- | --- |
| 홈 핵심 비즈니스 대표 카드 | 4:3 | 1448×1086 | PNG/JPG |
| Software·AI Solutions 상세 모달 | 16:9 | 1672×941 | PNG |
| 교육 사례 대표 카드·라이트박스 | 4:3 | 1448×1086 | JPG |
| 실제 프로젝트 대표 이미지 | 16:9 | 1672×941 | JPG/PNG |

### 파일명 규칙

- 기존 에셋을 같은 파일명으로 덮어쓰지 않는다. Next.js 이미지 최적화 캐시가 이전 이미지를 계속 노출할 수 있다.
- 새 결과는 의미가 드러나는 고유 파일명을 사용한다.
- 예: `ai-web-app-class-result-v2.jpg`, `gemini-oneday-class-mockup.jpg`, `software-admin-system-v2.png`
- 새 이미지를 적용한 뒤 실제 페이지 HTML의 `src` 또는 `srcSet`이 새 파일명을 가리키는지 확인한다.
- 최적화 캐시가 계속 남으면 새 파일명으로 다시 발급하고, 필요한 이미지에만 `unoptimized: true`를 사용한다.

## 3. 최종 적용 에셋 목록

| 영역 | 최종 파일 | 연결 코드 | 상태 |
| --- | --- | --- | --- |
| Software 대표 카드 | `public/work/software-overview-v2.png` | `src/components/sections/what-we-do.tsx` | 적용 |
| Software · 웹 서비스 | `public/work/software-web-sindohr-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 실제 사례 |
| Software · 모바일 앱 | `public/work/software-mobile-app-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| Software · 관리자 시스템 | `public/work/software-admin-system-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| Software · 내부 운영 도구 | `public/work/software-internal-tool-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| AI Solutions · AI 챗봇 | `public/work/ai-chatbot-hermes-v3.png` | `src/lib/pillar-examples.ts` | 적용 · 실제 사례 |
| AI Solutions · AI 에이전트 | `public/work/ai-agent-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| AI Solutions · 업무 자동화 | `public/work/ai-automation-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| AI Solutions · 사내 AI Tool | `public/work/ai-internal-tool-v2.png` | `src/lib/pillar-examples.ts` | 적용 · 콘셉트 |
| 실제 프로젝트 · 헤르메스 | `public/work/ai-chatbot-hermes.jpg` | `src/lib/site.ts` | 적용 · 실제 사례 |
| 교육 · AI 웹앱 만들기 | `public/education/ai-web-app-class-result-v2.jpg` | `src/lib/education-content.ts` | 적용 · 결과물 목업 |
| 교육 · Gemini 원데이클래스 | `public/education/gemini-oneday-class-mockup.jpg` | `src/lib/education-content.ts` | 적용 · 결과물 목업 |

참고: `public/work/ai-solutions-overview.png`은 현재 AI Solutions 대표 카드에 쓰이지만 이번 세션에서 새로 생성한 파일은 아니다. 새 AI 대표 카드를 만들 때는 기존 파일을 시리즈 기준 이미지로 사용할 수 있다.

## 4. 프롬프트 로그

아래에서 `원문 보존`은 실제 생성에 사용한 프롬프트를 보존한 항목이고, `복원 프롬프트`는 최종 이미지·콘텐츠 데이터·수정 요청을 바탕으로 다음 생성을 위해 정리한 항목이다.

### 4.1 Software 대표 카드

최종 파일: `public/work/software-overview-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 4:3 cover image for the KPOPSOFT home Software business card
Primary request: Present the full software delivery range in one sophisticated product composition: web service, mobile app, admin system, and internal operations tool.
Scene/backdrop: very pale blue studio canvas with a clean white central surface and restrained soft geometric accents.
Subject: one large modern web dashboard as the focal point, one mobile app mockup overlapping on the right, and two small supporting cards labeled Admin and Internal along the bottom.
Style/medium: high-fidelity modern SaaS product UI, clean editorial product mockup, believable and buildable interface.
Composition/framing: exact 4:3 landscape; interfaces fill about 78% of the frame; strong hierarchy and generous safe margins; readable at small card size.
Color palette: KPOPSOFT blue, navy, sky blue, mint, white, pale gray.
Text: use only short interface labels such as "Web", "Dashboard", "Mobile", "Admin", "Internal".
Constraints: no company logo, no fake client name, no fake performance claims, no people, no watermark.
Avoid: dark cyberpunk UI, strong gradients, excessive glass effects, tiny unreadable panels, excessive shadows.
```

### 4.2 Software 상세 · 웹 서비스 / 신도H렌탈

최종 파일: `public/work/software-web-sindohr-v2.png`  
참조 원본: 실제 신도H렌탈 웹사이트 화면  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 portfolio modal image for an actual responsive website project
Primary request: Create a premium device mockup presentation of the real SindoHR copier-rental website while preserving the supplied webpage design and branding.
Input images: use the supplied actual website screenshots as high-fidelity inserts; do not redesign or invent the client website.
Scene/backdrop: warm ivory studio background with very subtle floor shadows.
Subject: a mobile phone on the left, a tall full-page website capture in the center, and a large desktop monitor on the right showing the hero and industry recommendation section.
Style/medium: realistic device mockup combined with crisp source-screen compositing.
Composition/framing: exact 16:9; balanced three-device arrangement; all devices fully inside safe margins.
Constraints: preserve the real SindoHR logo, copier products, navy visual identity, and actual responsive layout; keep screen perspective believable.
Avoid: rewriting Korean copy, changing products, inventing analytics, duplicating the same device symmetrically, watermark.
```

### 4.3 Software 상세 · 모바일 앱

최종 파일: `public/work/software-mobile-app-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 concept portfolio image for mobile app development
Primary request: Show a polished cross-platform learning and habit app through three distinct mobile screens.
Scene/backdrop: warm ivory studio canvas with restrained blue, mint, yellow, and navy geometric shapes.
Subject: three upright smartphone mockups. Left screen shows today's learning and tasks, center screen shows a lesson detail and progress, right screen shows activity calendar and weekly learning statistics. Add at most two small supporting progress cards.
Style/medium: high-fidelity mobile product UI, clean Korean editorial style, believable iOS/Android app design.
Composition/framing: exact 16:9; center phone slightly larger; phones have different content and angles, not mirrored duplicates.
Text: short Korean labels only, such as "오늘의 학습", "활동", "주간 목표", "이어보기".
Constraints: clearly read as a concept example, no real client or performance claim, no brand logo.
Avoid: duplicated phone screens, social-media UI, neon, clutter, illegible body copy, watermark.
```

### 4.4 Software 상세 · 관리자 시스템

최종 파일: `public/work/software-admin-system-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 concept portfolio image for an admin system
Primary request: Present a realistic operations dashboard and member-management back office that demonstrates practical administration workflows.
Scene/backdrop: warm ivory product studio with a small blue geometric accent.
Subject: one large desktop monitor showing an operations dashboard with members, orders, revenue, content views, trend chart, status chart, and recent requests; one tablet on the right showing searchable member management, grades, statuses, Excel download, and member add controls.
Style/medium: high-fidelity Korean enterprise admin UI, restrained and implementation-ready.
Composition/framing: exact 16:9; desktop is the focal point and tablet is a secondary overlapping device.
Text: include a discreet "CONCEPT EXAMPLE" marker and short Korean admin labels.
Constraints: no real client name or real personal data; use obviously fictional names and example values.
Avoid: consumer app styling, oversized decorative elements, dark cyberpunk UI, fake testimonial, watermark.
```

### 4.5 Software 상세 · 내부 운영 도구

최종 파일: `public/work/software-internal-tool-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 concept portfolio image for an internal operations tool
Primary request: Visualize a single internal system that replaces scattered spreadsheets and messenger requests with a managed workflow.
Scene/backdrop: warm ivory canvas with KPOPSOFT navy and mint corner shapes.
Subject: a wide desktop browser showing a navy sidebar, task-status dashboard, four Kanban-style columns, request cards, approval request detail panel, activity log, connected services, notification settings, and workload chart. Add a narrow request-submission panel on the right.
Style/medium: high-fidelity enterprise web app, clear Korean operational UI, clean and buildable.
Composition/framing: exact 16:9; one cohesive system rather than unrelated screens.
Text: "CONCEPT EXAMPLE", "내부 운영 업무 관리 시스템", and short operational labels.
Constraints: no real company name, no confidential data, no fake business results.
Avoid: generic analytics-only dashboard, futuristic AI styling, excessive gradients, watermark.
```

### 4.6 AI Solutions 상세 · 헤르메스 AI 챗봇

최종 파일: `public/work/ai-chatbot-hermes-v3.png`  
실제 프로젝트 대표용 파생 파일: `public/work/ai-chatbot-hermes.jpg`  
프롬프트 유형: 복원 프롬프트

```text
Use case: compositing
Asset type: 16:9 portfolio modal image and actual-project cover for a KakaoTalk-based AI information chatbot
Primary request: Turn the supplied real chatbot screenshots into a polished two-phone mockup. The user must immediately understand that the chatbot receives a request and returns a structured AI news summary.
Input images: preserve the supplied KakaoTalk conversation and chatbot profile screenshots as the actual project evidence.
Scene/backdrop: warm ivory studio canvas with large restrained navy and coral circular accents and small dot patterns.
Subject: exactly two smartphones, not mirrored. The larger left phone shows the chatbot conversation and summarized response. The smaller right phone shows the chatbot profile or a clearly different complementary screen.
Style/medium: realistic premium phone mockup with high-fidelity screen compositing.
Composition/framing: exact 16:9; left phone slightly forward; right phone set back with natural asymmetry; generous empty space around devices.
Constraints: preserve the recognizable KakaoTalk context and real project screen; do not invent company metrics or claims.
Avoid: three phones, mirrored left/right phones, two nearly identical chat screens, extra social counters, fake app branding, watermark.
```

변경 이력:

- `ai-chatbot-hermes-v2.png`: 세 대의 휴대폰을 사용한 중간 시안. 화면 중복과 좌우 대칭감 때문에 미적용.
- `ai-chatbot-hermes-v3.png`: 두 대의 비대칭 휴대폰으로 정리한 최종 모달 이미지.
- `ai-chatbot-hermes.jpg`: 같은 최종 방향을 실제 프로젝트 카드 규격에 맞춘 파생본.

### 4.7 AI Solutions 상세 · AI 에이전트

최종 파일: `public/work/ai-agent-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 concept portfolio image for an AI agent
Primary request: Show an AI agent that goes beyond chat by receiving a business request, checking internal sources, generating a report, assigning a person, and pausing for human approval.
Scene/backdrop: warm ivory canvas with restrained coral, navy, and mint geometric accents.
Subject: one desktop browser split into three clear columns. Left: incoming request inbox. Center: chronological agent execution steps including requirements analysis, data lookup, report generation, and assignee recommendation. Right: generated summary report and a prominent human approval or revision decision.
Style/medium: high-fidelity enterprise AI product UI, calm, credible, buildable.
Composition/framing: exact 16:9; execution timeline is the focal point; all Korean labels large enough to read.
Constraints: make the human-in-the-loop stop point explicit; no autonomous-risk claims, no real client data.
Avoid: chatbot-only layout, humanoid robots, glowing AI brain imagery, fake success rate claims, watermark.
```

### 4.8 AI Solutions 상세 · 업무 자동화

최종 파일: `public/work/ai-automation-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: productivity-visual
Asset type: 16:9 concept portfolio image for business workflow automation
Primary request: Present a clear automation workflow from intake to team notification, including a branch that stops for human review when conditions are not met.
Scene/backdrop: warm ivory background with navy sidebar and restrained mint, blue, yellow, and coral accents.
Subject: one large browser UI. Top row contains five connected stages: new inquiry, data collection, AI classification and summary, report generation, team notification. Show success states and a conditional review branch. Bottom area contains execution history, report preview, and notification preview.
Style/medium: high-fidelity workflow builder and operations dashboard, clean Korean UI.
Composition/framing: exact 16:9; connected stages read left to right at thumbnail size.
Constraints: include a visible human-check path; no fake client name or performance promise.
Avoid: abstract node spaghetti, tiny unreadable nodes, robotic characters, neon, watermark.
```

### 4.9 AI Solutions 상세 · 사내 AI Tool

최종 파일: `public/work/ai-internal-tool-v2.png`  
프롬프트 유형: 복원 프롬프트

```text
Use case: ui-mockup
Asset type: 16:9 concept portfolio image for a private internal AI tool
Primary request: Show a company-only AI workspace that answers from approved internal documents and respects team permissions.
Scene/backdrop: warm ivory canvas with restrained coral, navy, mint, and geometric line accents.
Subject: one wide desktop browser. Left sidebar shows team workspace, member permissions, and saved templates. Main area shows report summary, policy search, and document comparison templates plus a grounded AI answer with cited sources. Right column shows approved documents and activity history.
Style/medium: high-fidelity secure enterprise AI interface, clean Korean editorial layout.
Composition/framing: exact 16:9; source grounding and access permissions must be visually obvious.
Text: "사내 AI Tool", "개념 예시 화면 (실제 서비스 아님)" and short Korean UI labels.
Constraints: no real company data, no claim of absolute security, no external AI brand logo.
Avoid: public chatbot look, generic chat bubbles only, cyber-security cliché graphics, watermark.
```

### 4.10 교육 사례 · AI 웹앱 만들기 과정

최종 파일: `public/education/ai-web-app-class-result-v2.jpg`  
참조 이미지: `/Users/lena/Downloads/IMG_2708.jpg`  
프롬프트 유형: 원문 보존

```text
Use case: ui-mockup
Asset type: 4:3 thumbnail and lightbox cover for the KPOPSOFT Education case "AI 웹앱 만들기 과정"
Primary request: Create a sophisticated, minimal result-mockup image that presents two web apps completed during the class: a daily note webpage and a category-based Todo app. This should replace the classroom photo and make the student outcomes immediately visible.
Input images: Image 1 is a style and composition reference only. Borrow the layered floating interface-card composition, clean white surfaces, angled perspective, and airy premium presentation. Do not copy its forms, typography, branding, social-media overlay icons, gradient colors, or exact UI.
Scene/backdrop: warm ivory (#F6F1EA) flat studio canvas with a very pale sky-blue panel and restrained mint/blue geometric shapes; clean and spacious.
Subject: two main browser-window mockups layered diagonally in a shallow three-dimensional composition. The larger front-left browser shows a calm Daily Note web app with a date selector, short journal cards, tags, and a simple writing area. The slightly smaller rear-right browser shows a category Todo app with three clean category columns, checkboxes, progress, and an add-task control. Include one or two very small floating UI fragments only if they improve depth.
Style/medium: high-fidelity modern web product UI, refined Korean editorial design, minimal product mockup, crisp white cards, subtle realistic elevation, buildable and believable.
Composition/framing: exact 4:3 landscape; the two browser mockups fill approximately 75% of the canvas while staying entirely within 8% safe margins; slightly angled overlapping layers similar in depth to the reference; strong focal hierarchy; readable as a small education-case thumbnail.
Lighting/mood: bright neutral studio light, polished, calm, creative, professional.
Color palette: warm ivory #F6F1EA, primary blue #315BDB, sky blue #72A3E8, mint #63C7B2, warm yellow #FFC85C, white, ink #292522; use flat fills and soft tints rather than gradients.
Text (verbatim, use only these short labels): "DAILY NOTE", "오늘의 기록", "TODO", "개인", "업무", "학습", "완료"
Constraints: clearly show two distinct finished web-app results; no people or classroom; no client/company name; no fake success metrics or claims; no KPOPSOFT logo; no caption outside the mockups; clean Korean spelling; keep interface detail large enough to recognize at thumbnail size.
Avoid: copying the reference UI, social-media heart icons or counters, TikTok-like overlays, excessive glassmorphism, neon, cyberpunk, glossy 3D blobs, heavy gradients, excessive shadows, clutter, watermark.
```

### 4.11 교육 사례 · Gemini 원데이클래스

최종 파일: `public/education/gemini-oneday-class-mockup.jpg`  
참조 이미지: `public/education/ai-web-app-class-result-v2.jpg`를 같은 시리즈의 스타일 기준으로 사용  
프롬프트 유형: 원문 보존

```text
Use case: ui-mockup
Asset type: 4:3 education case thumbnail and lightbox cover for the KPOPSOFT class "Gemini 원데이클래스"
Primary request: Create a sophisticated, minimal result mockup that instantly shows five polished AI-assisted outcomes made in a two-hour class: a summary, a research report, a canvas document, a generated image, and a custom Gem assistant.
Input images: Image 1 is the visual-series reference from the same website. Preserve its warm ivory studio backdrop, large layered floating browser-window composition, clean white UI surfaces, gentle perspective, soft realistic elevation, blue/mint/yellow accents, spacious presentation, and overall polish. Do not duplicate its Daily Note or Todo content.
Scene/backdrop: warm ivory flat studio canvas with a very pale sky-blue panel and restrained mint/blue geometric shapes.
Subject: two distinct overlapping desktop browser mockups. The larger front-left window is an elegant AI workspace with a concise research report preview, title, short summary blocks, source chips, and a small document canvas area. The rear-right window is a custom assistant builder called MY GEM, with a friendly assistant avatar, instruction field, uploaded knowledge cards, and a completed status. Add a small floating tray with five clear output tiles representing summary, research, canvas, image, and Gem.
Style/medium: high-fidelity modern web product UI, refined Korean editorial design, minimal product mockup, crisp white cards, believable and buildable interface.
Composition/framing: exact 4:3 landscape; two browser mockups fill about 75% of the canvas while staying inside 8% safe margins; diagonal layered perspective matching the reference image's family; large UI hierarchy readable at thumbnail size.
Lighting/mood: bright neutral studio light, polished, calm, intelligent, creative, professional.
Color palette: warm ivory #F6F1EA, primary blue #315BDB, sky blue #72A3E8, mint #63C7B2, warm yellow #FFC85C, white, ink #292522; flat fills and soft tints, no strong gradient.
Text (verbatim, use only these short labels): "AI WORKSPACE", "리서치 보고서", "핵심 요약", "MY GEM", "나만의 AI", "요약", "리서치", "Canvas", "이미지", "Gem", "완료"
Constraints: clearly show five distinct finished class outcomes; no people or classroom; no client/company name; no fake metrics or claims; no Google or Gemini logo; no caption outside the mockups; accurate Korean spelling; keep text large and sparse.
Avoid: Daily Note or Todo interface, exact copying of Gemini's live product UI, brand logos, social-media overlays, excessive glassmorphism, neon, cyberpunk, glossy 3D blobs, heavy gradients, excessive shadows, clutter, watermark.
```

## 5. 교육 갤러리 연결 규칙

- 카드 대표 이미지는 결과물 목업을 사용한다.
- 클릭 후 갤러리는 `대표 목업 → 실제 강의 사진` 순서로 구성한다.
- `coverImage`가 첫 번째 슬라이드이고 `galleryImages`가 그 뒤에 이어진다.
- 카드 배지는 별도 숫자를 저장하지 않고 실제 배열 길이로 계산한다.
- 배지에는 전체 장수의 숫자만 표시한다. 예: 두 장이면 `2`.
- 현재 구성:
  - 조직·기업: 대표 현장 이미지 1장, 캐러셀 없음
  - AI 웹앱 만들기: 목업 1장 + 실제 강의 사진 1장
  - Gemini 원데이클래스: 목업 1장 + 실제 강의 사진 2장
- 모달은 좌우 버튼, 키보드 방향키, 모바일 스와이프, 마지막↔처음 순환 이동을 지원한다.

## 6. 다음 이미지 추가 체크리스트

1. 실제 사례인지 콘셉트 예시인지 먼저 결정한다.
2. 실제 사례라면 원본 화면을 `reference image` 또는 `supporting insert`로 명시한다.
3. 대표 카드인지 상세 모달인지 확인하고 4:3 또는 16:9 규격을 선택한다.
4. 같은 섹션의 기존 최종 이미지를 스타일 레퍼런스로 함께 넣는다.
5. 이미지 안에 꼭 필요한 짧은 문구만 `Text (verbatim)`으로 지정한다.
6. 회사명·성과·수치는 확인된 정보만 사용한다.
7. 새 의미형 파일명으로 저장하고 `public/` 안에 복사한다.
8. 소비 코드의 이미지 경로와 대체 텍스트를 함께 수정한다.
9. 실제 페이지가 새 파일 경로를 내려주는지 확인한다.
10. 작은 카드 크기와 확대 모달 양쪽에서 여백·가독성·잘림을 확인한다.

## 7. 생성 제외 · 공식 브랜드 패턴

- `public/assets/Pattern/Diamond L.svg`는 이미지 생성 결과가 아니라 사용자가 제공한
  KPOPSOFT 공식 패턴 원본이다.
- 파랑 원, 빨강 스파크, 민트 웨이브가 연결되어 하나의 조화로운 흐름으로 확장되는
  의미를 담는다.
- OUR IDENTITY 카드의 확정 라벨은 `HARMONY IN FLOW`다.
- 확정 문구는 아래처럼 고정 줄바꿈한다.

```text
서로 다른 요소를 연결해
하나의 조화로운 흐름으로 확장합니다
```

- 이후 같은 영역을 수정할 때 패턴을 AI로 다시 그리거나 형태·색을 임의로 바꾸지 않는다.
- 어두운 배경 위에 원본 SVG를 그대로 사용하고, 문구 가독성이 필요하면 그라데이션이나
  크롭 방식만 조정한다.
