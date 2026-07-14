# KPOPSOFT

소프트웨어 개발 · AI 솔루션 · 실무 교육을 제공하는 기술 기업 **KPOPSOFT**의 공식 랜딩페이지.

/ [기획서](docs/기획서.md) · [디자인](docs/디자인.md) · [스펙](docs/스펙.md) · [개발상태](docs/개발상태.md)

## 기술 스택

- **Next.js 16** (App Router) + **React 19** + **TypeScript**
- **Tailwind CSS v4** + **shadcn/ui** (base-ui)
- 폰트: Pretendard(국문) + 시스템 그로테스크
- 반응형 웹앱 + PWA(manifest/아이콘/viewport) — 모바일·태블릿·데스크톱 하이브리드 지향

> 관리자 플랫폼은 Auth.js Google OAuth, Neon Postgres, Vercel Blob, Cloudflare Email Service, Linear로 구성됩니다. 외부 프로비저링 상태는 [개발상태](docs/개발상태.md)의 HOLD 체크리스트를 확인하세요.

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
    admin/              # 문의·CMS·팀 관리
  components/
    layout/             # Header(모바일 Sheet 메뉴), Footer, Section 래퍼
    sections/           # 섹션별 컴포넌트 14개 (hero, business-overview, ...)
    shapes/             # 재사용 기하 도형 시스템 (circle/arch/star/wave/capsule ...)
    ui/                 # CtaButton, Tag, Eyebrow + shadcn 프리미티브
  lib/
    admin/              # 관리자 인증·Neon 저장소 seam
    db/                 # Drizzle 스키마·DB 연결
    integrations/       # Cloudflare Email·Linear
    site.ts             # 기본 공개 콘텐츠/설정
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

## 배포 전 필수 설정

- Vercel Marketplace Neon/Blob 연결과 DB 마이그레이션·시드
- Google OAuth callback/비밀값, 초기 관리자 이메일
- Cloudflare 검증 발신자·수신자, Linear API 연결
- Preview에서 문의·메일·Linear·Blob·모바일 스모크 테스트
