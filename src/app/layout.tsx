import type { Metadata, Viewport } from "next";
import "./globals.css";

/**
 * 정식 도메인. `metadataBase`가 되어 canonical·og:url이 전부 이 주소를 기준으로
 * 만들어진다 — Vercel 주소로 두면 공유 링크와 검색 결과에 그 주소가 노출된다.
 * `kpopsoft.com`은 `www`로 308 리다이렉트되므로 `www` 쪽이 정식이다.
 */
const siteUrl = "https://www.kpopsoft.com";
const siteTitle = "KPOPSOFT — 아이디어를 작동하는 기술로";
const siteDescription =
  "KPOPSOFT는 비즈니스에 필요한 소프트웨어를 만들고, AI를 실제 업무에 적용하며, 전문가의 경험을 실무 중심의 교육으로 연결합니다.";

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: {
    default: siteTitle,
    template: "%s | KPOPSOFT",
  },
  description: siteDescription,
  keywords: [
    "KPOPSOFT",
    "소프트웨어 개발",
    "AI 솔루션",
    "AI 교육",
    "Vibe Coding",
    "AI 업무 자동화",
  ],
  // og:image는 src/app/opengraph-image.png 파일 규칙으로 자동 주입된다.
  openGraph: {
    type: "website",
    locale: "ko_KR",
    url: siteUrl,
    siteName: "KPOPSOFT",
    title: siteTitle,
    description: siteDescription,
  },
  twitter: {
    card: "summary_large_image",
    title: siteTitle,
    description: siteDescription,
  },
};

export const viewport: Viewport = {
  themeColor: "#F6F1EA",
  width: "device-width",
  initialScale: 1,
  viewportFit: "cover",
};

/**
 * **CSP nonce 때문에 전 페이지를 동적 렌더링으로 고정한다. 지우면 안 된다.**
 *
 * `proxy.ts`가 요청마다 nonce를 만들어 CSP 헤더에 넣고, Next가 그 헤더를 파싱해
 * 스크립트에 nonce를 붙인다. **빌드 때 미리 만든 HTML에는 그 nonce가 없다.**
 * 정책에 `'strict-dynamic'`이 있어서 `'self'`는 무시되므로, nonce 없는 페이지는
 * 강제 모드에서 **스크립트가 전부 막힌다**(2026-08-05 실측: `/admin/login`
 * script 13개 중 nonce 0개).
 *
 * 왜 페이지별이 아니라 여기인가 — 페이지마다 붙이면 **나중에 추가되는 정적
 * 페이지가 조용히 막힌다.** 빌드 로그를 눈으로 보지 않으면 알아챌 방법이 없고,
 * 증상은 "그 페이지만 인터랙션이 안 된다"라 원인에 닿기 어렵다. 여기 한 줄이면
 * 새 페이지도 자동으로 지켜진다.
 *
 * 잃는 것은 사실상 없다 — 2026-08-06 빌드 기준 정적이던 HTML 라우트는
 * `/admin/login`·`/education/cases`(빈 플레이스홀더)·`/_not-found` 셋뿐이고,
 * 나머지 40여 개는 Supabase를 읽어서 이미 동적이었다.
 *
 * 근거 — docs/07-dev/14-CSP-정책과-적용.md §5.
 */
export const dynamic = "force-dynamic";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full antialiased">
      <head>
        <link
          rel="preconnect"
          href="https://cdn.jsdelivr.net"
          crossOrigin="anonymous"
        />
        {/*
         * Pretendard 폰트 로딩.
         * preload로 woff2를 미리 받아 두고 stylesheet로 font-face를 등록한다.
         * Server Component에서는 onLoad 이벤트 핸들러를 쓸 수 없어 non-blocking
         * 기법(media="print"→onload) 대신 이 방식을 사용한다.
         * 핵심 성능 병목(Supabase 왕복 8.9s)은 unstable_cache로 해결됐으므로
         * 폰트 로딩 방식의 영향은 미미하다.
         */}
        <link
          rel="preload"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/woff2/PretendardVariable.woff2"
          as="font"
          type="font/woff2"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://cdn.jsdelivr.net/gh/orioncactus/pretendard@v1.3.9/dist/web/variable/pretendardvariable-dynamic-subset.min.css"
        />
      </head>
      <body className="bg-background text-foreground min-h-full flex flex-col font-sans">
        {children}
      </body>
    </html>
  );
}
