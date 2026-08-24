import type { MetadataRoute } from "next";

import { getPublicRegularClasses } from "@/lib/public-content";

/**
 * sitemap.ts — Next.js 16 파일 컨벤션으로 sitemap.xml을 자동 생성한다.
 *
 * **왜 이 파일이 필요한가**
 * 기존에 sitemap 파일이 없어 Google Search Console이 /sitemap.xml 요청 시
 * Next.js의 기본 HTML 404 페이지를 받았다. GSC는 이를 "Sitemap이 HTML입니다"
 * 오류로 보고했다 (docs/07-dev/15-sitemap-구축.md 참고).
 *
 * **force-dynamic을 붙이지 않는 이유**
 * sitemap.ts는 layout.tsx·page.tsx와 달리 CSP nonce가 필요 없다.
 * Next.js 16은 sitemap Route Handler를 기본적으로 캐싱하므로
 * force-dynamic 없이도 빌드/런타임 캐시가 작동한다.
 * /education/programs/[slug] URL들은 DB에서 slug 목록을 읽어 동적으로 포함한다.
 */

const BASE_URL = "https://www.kpopsoft.com";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  // 정규 클래스 slug 목록 — 공개된 과정만 포함된다 (RLS 적용)
  const regularClasses = await getPublicRegularClasses().catch(() => []);

  const programUrls: MetadataRoute.Sitemap = regularClasses.map((c) => ({
    url: `${BASE_URL}/education/programs/${c.slug}`,
    changeFrequency: "monthly",
    priority: 0.7,
  }));

  return [
    {
      url: BASE_URL,
      changeFrequency: "weekly",
      priority: 1,
    },
    {
      url: `${BASE_URL}/work`,
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/education`,
      changeFrequency: "weekly",
      priority: 0.9,
    },
    {
      url: `${BASE_URL}/education/programs`,
      changeFrequency: "weekly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/education/cases`,
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...programUrls,
  ];
}
