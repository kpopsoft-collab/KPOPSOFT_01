import type { MetadataRoute } from "next";

/**
 * PWA manifest so the site installs and behaves app-like on mobile
 * (docs/스펙.md — 하이브리드로 잘 되게).
 */
export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "KPOPSOFT",
    short_name: "KPOPSOFT",
    description:
      "소프트웨어 · AI 솔루션 · 실무 교육을 제공하는 기술 기업 KPOPSOFT",
    start_url: "/",
    display: "standalone",
    background_color: "#F6F1EA",
    theme_color: "#F6F1EA",
    lang: "ko",
    icons: [
      { src: "/icon-512.svg", sizes: "any", type: "image/svg+xml", purpose: "any" },
      {
        src: "/icon-maskable.svg",
        sizes: "any",
        type: "image/svg+xml",
        purpose: "maskable",
      },
    ],
  };
}
