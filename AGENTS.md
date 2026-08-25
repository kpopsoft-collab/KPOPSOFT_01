<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` before writing any code. Heed deprecation notices.
<!-- END:nextjs-agent-rules -->

## INSTALLED SKILLS

- `karpathy-guidelines`: 코드 작성·리뷰·리팩터링 시 단순하고 검증 가능한 변경을 유지합니다. (`.agents/skills/karpathy-guidelines/SKILL.md`)

## UI DEVELOPMENT

- UI 작업 전 [docs/04-design-system/13-UI-개발가이드.md](docs/04-design-system/13-UI-개발가이드.md)를 먼저 읽는다.
- 해당 화면의 `docs/02-home` 또는 `docs/03-education` 문서와 현재 `page.tsx` import를 함께 확인한다.
- 새 스타일을 만들기 전에 `src/components/ui`, `src/components/layout`, `src/app/globals.css`의 기존 컴포넌트와 토큰을 재사용한다.
- 완료 전 `bun run lint`, `bunx tsc --noEmit`, `bun run build`를 실행한다.
