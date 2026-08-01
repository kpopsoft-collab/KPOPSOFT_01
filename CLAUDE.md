# KPOPSOFT

소프트웨어 개발 · AI 솔루션 · 실무 교육을 제공하는 회사의 공식 랜딩페이지 프로젝트.

## 문서

작업 전 반드시 아래 문서를 기준으로 판단한다. 문서 내용과 코드가 어긋나면 문서를 우선한다.

문서는 **아래로 갈수록 오래된 것**이다. 같은 화면을 두 문서가 다르게 지시하면 위쪽을 따른다.

**최신 기준 — 수정 요청서 3종**

- [docs/KPOPSOFT_education_page_revision_request.md](docs/KPOPSOFT_education_page_revision_request.md) — **Education 최신 기준**. 9섹션 재편, 기업교육·정규과정 상세 페이지 신설
- [docs/KPOPSOFT_home_4th_revision_request.md](docs/KPOPSOFT_home_4th_revision_request.md) — **홈 최신 기준**. 사례·핵심사업·레이더·프로세스 4개 영역 보강
- [docs/KPOPSOFT_homepage_revision_request.md](docs/KPOPSOFT_homepage_revision_request.md) — 홈 섹션 순서 확정(OUR IDENTITY·WHY KPOPSOFT 신설). 확정 카피의 출처

**그 앞 단계 — ver3**

- [docs/IA_ver3_요약.md](docs/IA_ver3_요약.md) — ver3 전체 개편 한 장 요약(확정 결정·미결 항목 포함)
- [docs/KPOPSOFT_Home_Landing_ver3.md](docs/KPOPSOFT_Home_Landing_ver3.md) — 홈 ver3. IA 기반 7섹션 구성
- [docs/KPOPSOFT_Education_Page_ver3.md](docs/KPOPSOFT_Education_Page_ver3.md) — Education ver3. 교육 3분류 체계
- [docs/KPOPSOFT HOMEPAGE IA .png](docs/KPOPSOFT%20HOMEPAGE%20IA%20.png) — 전체 IA 원본. 위 두 ver3 문서의 출처

**상시 유효**

- [docs/디자인.md](docs/디자인.md) — 디자인 시스템 전체(컬러, 타이포, 그리드, 도형/컴포넌트 체계, 모션, 접근성)
- [docs/스펙.md](docs/스펙.md) — 기술 스펙
- [docs/개발상태.md](docs/개발상태.md) · [docs/작업로그.md](docs/작업로그.md) — 현재 상태와 판단 근거, 남은 결정 사항
- [docs/기획서.md](docs/기획서.md) — 초기 16섹션 기획. 대부분 대체됨(참고용)

ver2 기획서 2종은 상단에 대체 안내가 붙어 있다. ver3가 "ver2 유지"로 지정한 항목
(디자인 방향·이미지 원칙·반응형·접근성)은 여전히 ver2를 참조한다.

**교육 3분류 체계** — 조직·기업 맞춤 교육 / 정규 클래스(4과정) / 지식 공유 커뮤니티 클럽(바이브데이즈).
홈과 `/education` 전 영역에 동일한 명칭으로 적용한다. `AI Prototype Lab`은 폐지됐다.

## 기술 스택

- Framework: Next.js (App Router)
- DB/Auth: Supabase (PostgreSQL, 회원가입/로그인 포함)
- Hosting: Vercel
- UI: Shadcn UI + Tailwind CSS
- Repo: GitHub
- 형태: 반응형 웹앱. 모바일/태블릿/데스크톱 모두에서 앱처럼 매끄럽게 동작해야 함(하이브리드 지향) — PWA 설정(manifest, 아이콘, 뷰포트) 포함해서 구현할 것.

## 디자인 토큰 요약 (자세한 내용은 docs/디자인.md)

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
