# KPOPSOFT

소프트웨어 개발 · AI 솔루션 · 실무 교육을 제공하는 회사의 공식 랜딩페이지 프로젝트.

## 문서

**모든 문서는 [docs/00-START-HERE.md](docs/00-START-HERE.md)에서 시작한다.**
주제 하나가 폴더 하나이고, 각 폴더의 `00-START-HERE.md`가 그 주제의 시작점이다.
폴더 안 문서는 번호 순서대로 읽는다. 문서 하나는 200줄을 넘지 않는다.

작업 전 반드시 문서를 기준으로 판단한다. 문서 내용과 코드가 어긋나면 문서를 우선한다.

| 폴더 | 내용 | 언제 |
|------|------|------|
| [docs/01-ia/](docs/01-ia/00-START-HERE.md) | ver3 정보구조 요약, 교육 3분류 관통 원칙, IA 원본 | 전체 그림 |
| [docs/02-home/](docs/02-home/00-START-HERE.md) | 홈 기준 — 수정 요청서 3종 + ver3 기획 | 홈 작업 |
| [docs/03-education/](docs/03-education/00-START-HERE.md) | 교육 기준 — 수정 요청서 + ver3 기획 | `/education` 작업 |
| [docs/04-design-system/](docs/04-design-system/00-START-HERE.md) | 컬러·타이포·그리드·도형·컴포넌트·모션·접근성 | **상시** |
| [docs/05-assets/](docs/05-assets/00-START-HERE.md) | 이미지 생성 프롬프트 로그, 규격, 브랜드 패턴 | 이미지 추가 |
| [docs/06-admin/](docs/06-admin/00-START-HERE.md) | 어드민 — 데이터 모델, RLS, 화면, 구축 계획 | **상시** (DB/인증) |
| [docs/07-dev/](docs/07-dev/00-START-HERE.md) | 기술 스펙, 개발 상태, 작업 로그, 인수인계 | 착수 전 / 배포 전 |
| [docs/99-archive/](docs/99-archive/00-START-HERE.md) | ver2 기획 2종, 초기 16섹션 기획 (대체됨) | ver2 유지 항목 확인 |

**충돌하면 이 순서** — 각 폴더의 수정 요청서(앞번호) → ver3 기획서(뒷번호) →
`01-ia` 요약 → `99-archive`의 ver2. ver3가 "ver2 유지"로 지정한 항목
(디자인 방향·이미지 원칙·반응형·접근성)만 여전히 아카이브를 참조한다.

문서를 고쳐 200줄을 넘기면 주제 경계에서 쪼개고, 해당 폴더의 `00-START-HERE.md`
목록과 앞뒤 문서의 이전/다음 링크를 같이 고친다.

**교육 3분류 체계** — 조직·기업 맞춤 교육 / 정규 클래스(4과정) / 지식 공유 커뮤니티 클럽(바이브데이즈).
홈과 `/education` 전 영역에 동일한 명칭으로 적용한다. `AI Prototype Lab`은 폐지됐다.

## 기술 스택

- Framework: Next.js (App Router)
- DB/Auth: Supabase (PostgreSQL, 회원가입/로그인 포함)
- Hosting: Vercel
- UI: Shadcn UI + Tailwind CSS
- Repo: GitHub
- 형태: 반응형 웹앱. 모바일/태블릿/데스크톱 모두에서 앱처럼 매끄럽게 동작해야 함(하이브리드 지향) — PWA 설정(manifest, 아이콘, 뷰포트) 포함해서 구현할 것.

## 디자인 토큰 요약 (자세한 내용은 docs/04-design-system/)

- 배경: Warm Ivory `#F6F1EA` / 텍스트: `#292522`
- 액센트: Blue `#315BDB`, Red `#F04B32`, Yellow `#FFC85C`, Coral `#FF9A95`, Mint `#63C7B2`, Sky `#72A3E8`, Navy `#243562`
- 폰트: 영문 Inter/Geist/Manrope 계열, 국문 Pretendard/SUIT/Wanted Sans
- 그래픽 언어: circle, arch, star, wave, capsule 등 기하학적 도형을 재사용 가능한 시스템으로 사용 (일러스트 대체 금지)
- 그라데이션·글래스모피즘·과도한 그림자 금지, flat color + 강한 대비 유지
- 버튼 radius `999px`, primary CTA는 Primary Blue 배경
- 접근성: WCAG AA, 모바일 본문 최소 16px, 탭 타겟 최소 44px

## 컨벤션

- 섹션 단위로 컴포넌트화 (`components/sections/*`), 기획서의 16개 섹션 순서를 그대로 따른다.
- Tailwind 커스텀 테마에 위 디자인 토큰(컬러/폰트/라운드)을 등록해서 사용하고, 하드코딩된 hex/px 값을 컴포넌트에 직접 쓰지 않는다.
- UI는 Shadcn 컴포넌트를 베이스로 커스터마이징한다.
- 신규로 추가되는 npm/UI 라이브러리 API는 훈련 데이터 기억에 의존하지 말고 `context7` MCP로 최신 문서를 확인한다.

## 개발 워크플로우

기능 개발/수정은 `/dev <작업 내용>` 커맨드로 시작한다. 상세 동작은 [.claude/commands/dev.md](.claude/commands/dev.md) 참고. 이 프로젝트 전용 서브에이전트는 [.claude/agents/](.claude/agents/)에 정의되어 있다.

## MCP

- `playwright` — 반응형/E2E 검증 (프로젝트 스코프, `.mcp.json`)
- `context7` — Next.js/Supabase/Shadcn 최신 문서 조회 (프로젝트 스코프, `.mcp.json`)
- Supabase 프로젝트가 생성되면 `claude mcp add supabase -s project -e SUPABASE_ACCESS_TOKEN=<token> -- npx -y @supabase/mcp-server-supabase@latest --project-ref=<ref>` 로 Supabase MCP를 추가한다 (토큰 필요, 아직 미설정).
