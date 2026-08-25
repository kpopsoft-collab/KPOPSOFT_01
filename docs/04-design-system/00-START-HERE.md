# 04. 디자인 시스템 — 시작점

**상시 유효 문서다.** 버전(ver2/ver3) 축과 무관하게 화면을 그리는 모든 순간의 기준이다.
원본: `docs/디자인.md`

토큰은 컴포넌트에 하드코딩하지 않는다. Tailwind 커스텀 테마에 등록해 쓴다
(`src/app/globals.css`). 요약본은 [../../CLAUDE.md](../../CLAUDE.md) "디자인 토큰 요약".

## 읽는 순서

코드 주석의 `docs/04-design-system/ §N`은 아래 § 열(원본 `디자인.md`의 번호)로 찾는다.

| # | 문서 | § | 한 줄 |
|---|------|---|-------|
| 1 | [01-방향과-비주얼언어.md](01-방향과-비주얼언어.md) | DESIGN DIRECTION, §1 | 회사 소개, 디자인 방향(playful · editorial · intelligent), 비주얼 언어 |
| 2 | [02-컬러시스템.md](02-컬러시스템.md) | §2 | Warm Ivory 배경 + 7개 액센트. **hex 값의 유일한 출처** |
| 3 | [03-타이포그래피.md](03-타이포그래피.md) | §3 | Display / Section / Body / Eyebrow 스케일, 한글 줄바꿈 규칙 |
| 4 | [04-그리드.md](04-그리드.md) | §4 | 컬럼·거터·최대 폭·섹션 여백 |
| 5 | [05-도형시스템.md](05-도형시스템.md) | §5 | circle · arch · star · wave · capsule — **일러스트 대체 금지** |
| 6 | [06-컴포넌트-네비와-버튼.md](06-컴포넌트-네비와-버튼.md) | §6 (Navigation, Buttons) | 네비게이션, 버튼(radius `999px`, primary는 Blue) |
| 7 | [07-컴포넌트-카드와-다이어그램.md](07-컴포넌트-카드와-다이어그램.md) | §6 (Program Cards, Tags, Testimonial, Process Diagram) | 프로그램 카드, 전문 태그, 후기, 프로세스 다이어그램 |
| 8 | [08-히어로-디자인.md](08-히어로-디자인.md) | §7 | 히어로 구성과 도형 배치 |
| 9 | [09-섹션별-디자인원칙.md](09-섹션별-디자인원칙.md) | §8 (HERO, TRUST / PARTNERS, INTRODUCTION, PROGRAMS, SOFTWARE DEVELOPMENT, AI PROTOTYPE LAB, EXPERT NETWORK, PROCESS, CUSTOM TRAINING, FINAL CTA) | 섹션 유형별 레이아웃 원칙 |
| 10 | [10-이미지-방향.md](10-이미지-방향.md) | §9 | 이미지 톤·비율·처리 원칙 |
| 11 | [11-모션시스템.md](11-모션시스템.md) | §10 | 진입/hover 모션, 타이밍, `prefers-reduced-motion` |
| 12 | [12-모바일과-접근성.md](12-모바일과-접근성.md) | §11, §12 | 모바일 재구성, WCAG AA, 최종 원칙 |
| 13 | [13-UI-개발가이드.md](13-UI-개발가이드.md) | 구현 | **AI·개발자용.** 코드 위치, 컴포넌트 재사용, Next.js 16 규칙, 검증 절차 |

## 절대 규칙

| 하지 말 것 | 대신 |
|-----------|------|
| 그라데이션 · 글래스모피즘 · 과도한 그림자 | flat color + 강한 대비 |
| 일러스트로 도형 대체 | [05-도형시스템.md](05-도형시스템.md)의 기하학적 도형 재사용 |
| 문서에 없는 색·radius·간격 발명 | 가장 가까운 **문서화된 토큰**을 고른다 |
| 모바일을 데스크톱의 축소판으로 | [12-모바일과-접근성.md](12-모바일과-접근성.md)의 의도적 재구성 |
| 본문 16px 미만 · 탭 타겟 44px 미만 | WCAG AA 준수 |

## 문서에 남아 있는 옛 명칭

[09-섹션별-디자인원칙.md](09-섹션별-디자인원칙.md)에 `AI PROTOTYPE LAB` 섹션 항목이
남아 있다. 이 프로그램은 **폐지**됐다 —
[../01-ia/00-START-HERE.md](../01-ia/00-START-HERE.md) 참조.
레이아웃 원칙만 참고하고 명칭은 쓰지 않는다.

## 함께 보기

- 실제 화면별 카피와 구조 — [../02-home/00-START-HERE.md](../02-home/00-START-HERE.md) · [../03-education/00-START-HERE.md](../03-education/00-START-HERE.md)
- 이미지 생성 규격과 프롬프트 — [../05-assets/00-START-HERE.md](../05-assets/00-START-HERE.md)
- 카드·리스트 이미지 표현·보안·빈 상태·성능 — [10-이미지-방향.md](10-이미지-방향.md)
- 반응형·키보드·접근성 — [12-모바일과-접근성.md](12-모바일과-접근성.md)
- 감사 담당 서브에이전트 — `.claude/agents/design-reviewer.md`

← [문서 전체 시작점](../00-START-HERE.md)
