# Claude 인수인계 — 이미지·갤러리·브랜드 패턴 작업

작성일: 2026-08-02  
작업 브랜치: `redesign/ver2`  
기준 HEAD: `5e7670d assets(education): 바이브데이즈 카드에 대표 이미지(키비주얼) 적용`

이 문서는 현재 작업 트리의 미커밋 변경을 Claude가 이어받아 검토·커밋·배포하기 위한
체크리스트다. 사용자와 확정한 결과를 임의로 원복하지 말고, 아래 파일과 자산을 함께
커밋해야 한다.

## 1. 사용자와 확정한 최종 결과

### 홈 · 핵심 비즈니스 대표 카드와 상세 모달

- Software 대표 카드는 새 4:3 목업 `software-overview-v2.png`를 사용한다.
- AI Solutions 대표 카드는 기존 `ai-solutions-overview.png`를 유지한다.
- 두 대표 카드에서 하단 CTA pill을 제거하고 카드 전체를 하나의 클릭 영역으로 통일했다.
- 타이틀 오른쪽 화살표가 클릭 가능 상태를 알린다.
- 상세 모달에는 고정 16:9 이미지를 꽉 채워 표시한다.
- 상세 모달은 좌우 화살표, 키보드 방향키, 모바일 스와이프를 지원한다.
- 상세 모달 안에 문의 CTA를 넣었다. 모달을 닫은 뒤 문의 영역으로 이동하며 문의 유형이
  미리 선택된다.

Software 상세 사례 4개:

1. 신도H렌탈 웹 서비스 — 실제 프로젝트 기반 이미지
   `public/work/software-web-sindohr-v2.png`
2. 모바일 앱 — 콘셉트 포트폴리오
   `public/work/software-mobile-app-v2.png`
3. 관리자 시스템 — 콘셉트 포트폴리오
   `public/work/software-admin-system-v2.png`
4. 내부 운영 도구 — 콘셉트 포트폴리오
   `public/work/software-internal-tool-v2.png`

AI Solutions 상세 사례 4개:

1. 카카오톡 기반 AI 정보 응답 챗봇 — `public/work/ai-chatbot-hermes-v3.png`
   - 좌우 대칭 휴대폰 구성을 제거하고 서로 다른 모바일 화면 2개로 정리한 최종본이다.
   - `ai-chatbot-hermes-v2.png`는 중간 결과물이며 현재 코드에서 참조하지 않는다.
2. AI 에이전트 — `public/work/ai-agent-v2.png`
3. 업무 자동화 — `public/work/ai-automation-v2.png`
4. 사내 AI Tool — `public/work/ai-internal-tool-v2.png`

`public/work/ai-chatbot-hermes.jpg`도 수정 상태다. 홈 포트폴리오의 기존 헤르메스 사례가
이 경로를 사용하므로 변경 파일에서 누락하지 않는다.

### 교육 · 지난 프로그램 대표 이미지와 갤러리

- 조직·기업 사례는 대표 현장 이미지 1장만 사용한다. 카드 배지와 캐러셀은 없다.
- `AI 웹앱 만들기 과정`
  - 날짜: `2026년 6월`
  - 대표: `public/education/ai-web-app-class-result-v2.jpg`
  - 갤러리: 대표 목업 + `education-regular-01.jpg`, 총 2장
- `Gemini 원데이클래스`
  - 날짜: `2026년 7월`
  - 대표: `public/education/gemini-oneday-class-mockup.jpg`
  - 갤러리: 대표 목업 + `education-lecture-01.jpg` +
    `education-coaching-01.jpg`, 총 3장
- 카드 배지는 `+2`, `3장` 형식이 아니라 **실제 전체 이미지 수의 숫자만** 표시한다.
  현재 웹앱 카드는 `2`, Gemini 카드는 `3`이다.
- 배지 수는 별도 하드코딩하지 않고 `coverImage + galleryImages`의 길이로 계산한다.
- 라이트박스는 좌우 버튼, 키보드 방향키, 모바일 스와이프, 도트, `현재 / 전체` 카운터,
  이미지별 캡션을 제공한다. 마지막 이미지 다음에는 첫 이미지로 순환한다.
- 웹앱 대표 목업은 개발·최적화 캐시 문제를 피하기 위해 새 의미형 파일명과
  `unoptimized: true`를 사용한다.
- 참가자 수는 확인되지 않은 더미였으므로 지난 프로그램 및 교육 사례 카드에서 제거했다.

### OUR IDENTITY · 브랜드 패턴 카드

- 기존 Software / AI Solutions / Education 카드 아래 네 번째 결론 카드를 추가했다.
- 사용자 제공 원본 `public/assets/Pattern/Diamond L.svg`를 사용한다.
- 패턴을 새로 생성하거나 유사 이미지로 교체하지 않는다. 세 브랜드 요소가 결합된 공식
  시각 자산이다.
- 카드 배경은 `ink`, 패턴은 오른쪽 절반에 `object-cover`로 크게 크롭하고 왼쪽에는
  가독성을 위한 그라데이션을 둔다.
- 확정 문구:

```text
KPOPSOFT  HARMONY IN FLOW
서로 다른 요소를 연결해
하나의 조화로운 흐름으로 확장합니다
```

- 위 줄바꿈은 의도된 고정 줄바꿈이다.
- 1440px, 768px, 390px에서 확인했으며 가로 넘침이 없다.

### 같은 작업 트리에 포함된 콘텐츠 조정

- 홈/교육의 교육 수료생 수치를 `1,800+`에서 `200+`로 수정했다.
- 교육 누적 실적 기준 문구는 `2026년 7월`이다.
- 바이브데이즈 모집 예정 기수는 상태가 `open`이어도 `ctaDisabled: true`이면 신청 버튼을
  비활성 상태로 노출한다.
- 교육 사례 카드의 참가자 수 표기도 제거했다.

## 2. 코드 변경 파일

### 홈·브랜드

- `src/components/sections/what-we-do.tsx`
- `src/components/sections/pillar-examples-modal.tsx`
- `src/components/sections/our-identity.tsx`
- `src/lib/pillar-examples.ts`
- `src/lib/site.ts`

### 교육·공용 갤러리

- `src/components/sections/education/edu-cases.tsx`
- `src/components/sections/education/edu-stats.tsx`
- `src/components/sections/education/past-programs.tsx`
- `src/components/sections/education/vibedays-modal.tsx`
- `src/components/ui/cover-visual.tsx`
- `src/components/ui/image-lightbox.tsx`
- `src/lib/education-content.ts`

## 3. 새 자산과 문서

커밋에 반드시 포함:

- `public/assets/Pattern/Diamond L.svg`
- `public/education/ai-web-app-class-result-v2.jpg` — 1448×1086
- `public/education/gemini-oneday-class-mockup.jpg` — 1448×1086
- `public/work/software-overview-v2.png` — 1448×1086
- `public/work/software-web-sindohr-v2.png` — 1672×941
- `public/work/software-mobile-app-v2.png` — 1672×941
- `public/work/software-admin-system-v2.png` — 1672×941
- `public/work/software-internal-tool-v2.png` — 1672×941
- `public/work/ai-chatbot-hermes-v3.png` — 1672×941
- `public/work/ai-agent-v2.png` — 1672×941
- `public/work/ai-automation-v2.png` — 1672×941
- `public/work/ai-internal-tool-v2.png` — 1672×941
- `docs/image-generation-prompts.md`
- 이 인수인계 문서와 `docs/작업로그.md` 추가 기록

검토 후 선택:

- `public/work/ai-chatbot-hermes-v2.png` — 중간 결과물이며 현재 참조 없음. 최종본만
  보관하는 원칙이면 커밋에서 제외하거나 별도 보관한다. 사용자의 다른 파일을 임의로
  삭제하지 말고 먼저 현재 참조 여부를 다시 확인할 것.

## 4. 이미지 생성 기록

`docs/image-generation-prompts.md`에 다음 재사용 정보를 모두 기록했다.

- 공통 색상, 4:3/16:9 규격, 여백·스타일 원칙
- Software 대표/상세 5종
- AI Solutions 상세 4종
- 교육 결과물 목업 2종
- 실제 사용 프롬프트와 결과물을 보고 복원한 프롬프트의 구분
- 파일명·Next 이미지 캐시 회피 규칙
- 교육 갤러리 연결 및 이미지 수 계산 규칙

브랜드 `Diamond L.svg`는 생성 결과가 아니므로 같은 문서 하단의 “생성 제외” 규칙을
따른다.

## 5. 검증 상태

완료:

- `npx tsc --noEmit` 통과
- 이번 작업의 변경 파일 묶음 ESLint 통과
  (`vibedays-modal.tsx`는 아래의 기존 오류가 있어 별도 제외)
- `git diff --check` 통과
- 로컬 홈을 1440px / 768px / 390px에서 시각 확인
- 최종 브랜드 카드에서 가로 넘침 없음
- 브라우저 콘솔 error/warning 없음

알려진 전체 lint 상태:

- `npm run lint -- --quiet`는 기존 오류 7건 때문에 실패한다.
- 위치: `scripts/apply-work-content.cjs` 4건, `src/components/layout/header.tsx` 1건,
  `src/components/sections/education/vibedays-modal.tsx` 2건.
- 이번 이미지·패턴 작업 때문에 새로 발생한 오류는 확인되지 않았다.

배포 전 Claude가 반드시 다시 실행:

```bash
npx tsc --noEmit
npm run build
git diff --check
```

개발 서버가 `.next`를 사용 중이라면 종료 후 production build를 실행한다.

## 6. 권장 커밋 분리

1. `feat(home): 핵심 비즈니스 사례 이미지와 브랜드 패턴 개선`
   - What We Do, 사례 모달, `pillar-examples`, OUR IDENTITY
   - `public/work/*-v2`, 최종 `*-v3`, `public/assets/Pattern/`
2. `feat(education): 과정 결과물 갤러리와 콘텐츠 정리`
   - 교육 컴포넌트, 공용 라이트박스, 교육 콘텐츠/통계
   - `public/education/ai-web-app-class-result-v2.jpg`
   - `public/education/gemini-oneday-class-mockup.jpg`
3. `docs: 이미지 생성 프롬프트와 작업 인수인계 기록`

파일들이 서로 의존하므로 하나의 커밋으로 묶어도 동작상 문제는 없다. 다만 이미지 자산을
누락한 채 코드만 먼저 배포하면 404가 발생하므로 **코드와 참조 자산은 같은 배포 단위**여야
한다.

## 7. 배포 체크리스트

1. 현재 브랜치와 배포 대상 브랜치를 확인한다. 현재 작업 브랜치는 `redesign/ver2`다.
2. 미커밋 상태에서 사용자/다른 작업자의 변경을 원복하지 않는다.
3. 위 신규 자산이 staging에 포함됐는지 확인한다.
4. production build를 통과시킨다.
5. 커밋·푸시 후 배포 환경에서 아래 정적 자산이 HTTP 200인지 먼저 확인한다.
   - `/assets/Pattern/Diamond%20L.svg`
   - `/work/software-overview-v2.png`
   - `/work/software-web-sindohr-v2.png`
   - `/work/ai-chatbot-hermes-v3.png`
   - `/education/ai-web-app-class-result-v2.jpg`
   - `/education/gemini-oneday-class-mockup.jpg`
6. 홈에서 Software/AI 대표 카드 → 상세 모달 → 좌우 이동·스와이프·문의 CTA를 확인한다.
7. 교육 페이지에서 조직·기업은 배지 없음, 웹앱은 `2`, Gemini는 `3`인지 확인한다.
8. 교육 라이트박스에서 이미지·캡션·카운터가 함께 바뀌는지 확인한다.
9. OUR IDENTITY의 패턴 카드와 고정 줄바꿈을 데스크톱/모바일에서 확인한다.

## 8. 운영 주의

- 이번 작업은 Supabase DB를 수정하지 않았다.
- 과거 기록대로 `work_items` 같은 라이브 DB 콘텐츠를 바꿀 경우 배포 사이트에 즉시
  반영될 수 있다. 정적 이미지 배포를 먼저 끝낸 뒤 DB 경로를 바꿔야 한다.
- 이번 커밋·배포에는 별도 DB 마이그레이션이 필요하지 않다.
