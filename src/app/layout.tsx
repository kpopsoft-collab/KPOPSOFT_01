import type { Metadata, Viewport } from "next";
import "./globals.css";

const siteUrl = "https://kpopsoft-01.vercel.app";
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
