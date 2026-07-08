# KPOPSOFT

소프트웨어 개발 · AI 솔루션 · 실무 교육을 제공하는 기술 기업 **KPOPSOFT**의 공식 랜딩페이지.

/ [기획서](docs/기획서.md) · [디자인](docs/디자인.md) · [스펙](docs/스펙.md) · [개발상태](docs/개발상태.md)

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-ui)
- 폰트: Pretendard(국문) + 시스템 그로테스크
- 반응형 웹앱 + PWA(manifest/아이콘/viewport) — 모바일·태블릿·데스크톱 하이브리드 지향

> 데이터베이스/인증(Supabase)은 아직 연결하지 않았습니다. 모든 콘텐츠는 `src/lib/site.ts`의 정적 데이터이며, 문의 CTA는 `mailto:` 링크입니다.

## 실행

```bash
npm install      # 최초 1회
npm run dev      # 개발 서버 (http://localhost:3000)
npm run build    # 프로덕션 빌드 (Webpack)
npm run build:turbopack # Next.js 16 기본 Turbopack 빌드
npm run start    # 프로덕션 서버
```

## 구조

```
src/
  app/
    layout.tsx          # 폰트 로드, 메타데이터, viewport
    page.tsx            # 16개 섹션 조립 (기획서 순서)
    globals.css         # 디자인 토큰(@theme), 타이포 유틸, 스크롤 리빌 모션
    manifest.ts         # PWA manifest
    icon.svg            # 파비콘
  components/
    layout/             # Header(모바일 Sheet 메뉴), Footer, Section 래퍼
    sections/           # 섹션별 컴포넌트 14개 (hero, business-overview, ...)
    shapes/             # 재사용 기하 도형 시스템 (circle/arch/star/wave/capsule ...)
    ui/                 # CtaButton, Tag, Eyebrow + shadcn 프리미티브
  lib/
    site.ts             # 전 섹션 정적 콘텐츠/설정 + accent 컬러 맵
    utils.ts            # cn()
```

## 디자인 시스템 요약

- 배경 Warm Ivory `#F6F1EA` / 텍스트 Ink `#292522`
- 액센트 8종: Blue `#315BDB`, Red `#F04B32`, Yellow `#FFC85C`, Coral `#FF9A95`, Mint `#63C7B2`, Sky `#72A3E8`, Navy `#243562`
- flat 컬러 + 강한 대비 (그라데이션·글래스모피즘·과한 그림자 금지)
- 색 비율 ≈ 60% 배경 / 25% 뉴트럴 면 / 15% 강한 액센트
- 에디토리얼 비대칭 레이아웃, 기하 도형을 재사용 시각 언어로 사용
- 접근성 WCAG AA, 모바일 본문 ≥16px, 탭 타겟 ≥44px, `prefers-reduced-motion` 존중

토큰·컨벤션 상세와 개발 워크플로우(`/dev`, 팀 서브에이전트, MCP)는 [CLAUDE.md](CLAUDE.md) 참고.

## 다음 단계 (DB 연결 시)

- Supabase Auth 회원가입/로그인
- 문의 폼 실제 저장(`inquiries` 테이블 + RLS)
- 프로그램/전문가/후기/사례/인사이트 데이터의 DB화 (현재 `site.ts` 더미)
