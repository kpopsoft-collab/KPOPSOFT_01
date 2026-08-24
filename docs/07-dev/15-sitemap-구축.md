# 15. Sitemap 구축

## 이슈

**Google Search Console 오류**: `Sitemap이 HTML입니다.`

- **발견일**: 2026-08-23
- **현상**: GSC → Sitemaps → `https://www.kpopsoft.com/` 에서 발견된 페이지가 0개, 오류 1개
- **원인**: `/sitemap.xml` 라우트가 존재하지 않아 Next.js가 HTML 404 페이지를 반환했다. GSC 크롤러가 이를 유효하지 않은 형식으로 판단.

## 수정 내용

### 파일 생성

`src/app/sitemap.ts` — Next.js 16 파일 컨벤션 사용.

Next.js 16은 `app/sitemap.ts` 파일을 자동으로 `/sitemap.xml` 엔드포인트에 매핑하며, 반환 배열을 올바른 XML Sitemap 형식(`application/xml`)으로 직렬화한다.

### 포함된 URL

| URL | changeFrequency | priority |
|-----|----------------|----------|
| `https://www.kpopsoft.com` | weekly | 1.0 |
| `https://www.kpopsoft.com/work` | monthly | 0.8 |
| `https://www.kpopsoft.com/education` | weekly | 0.9 |
| `https://www.kpopsoft.com/education/programs` | weekly | 0.8 |
| `https://www.kpopsoft.com/education/cases` | monthly | 0.6 |
| `/education/programs/[slug]` (동적) | monthly | 0.7 |

동적 slug URL은 `getPublicRegularClasses()`로 DB에서 실시간 조회 — 공개 과정(`is_published=true`)만 포함된다.

### force-dynamic을 붙이지 않는 이유

`layout.tsx`와 `page.tsx`는 CSP nonce 때문에 `force-dynamic`이 필수다. 그러나 `sitemap.ts`는 HTML 페이지가 아니라 XML 데이터 Route Handler이므로 nonce가 불필요하다. Next.js 16은 sitemap을 기본으로 캐싱하며, `getPublicRegularClasses()`는 이미 `unstable_cache`로 감싸져 있어 DB 왕복이 캐시 히트 시 발생하지 않는다.

## 배포 후 확인 방법

1. `https://www.kpopsoft.com/sitemap.xml` 직접 접속 → XML 응답 확인
2. GSC → Sitemaps → 기존 sitemap URL 제출 (이미 제출됐다면 "다시 테스트")
3. 수 시간 ~ 수일 내에 "발견된 페이지" 숫자가 올라가야 정상

## 참고

- Next.js 16 Sitemap docs: `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/01-metadata/sitemap.md`
- GSC 오류 스크린샷: 이슈 발견 당시 스크린샷 참고
