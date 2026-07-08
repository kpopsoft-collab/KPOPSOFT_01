import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: {
    default: "KPOPSOFT — 아이디어를 작동하는 기술로",
    template: "%s | KPOPSOFT",
  },
  description:
    "KPOPSOFT는 비즈니스에 필요한 소프트웨어를 만들고, AI를 실제 업무에 적용하며, 전문가의 경험을 실무 중심의 교육으로 연결합니다.",
  keywords: [
    "KPOPSOFT",
    "소프트웨어 개발",
    "AI 솔루션",
    "AI 교육",
    "Vibe Coding",
    "AI 업무 자동화",
  ],
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
