import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow next/image to load public objects from Supabase Storage.
    remotePatterns: [
      {
        protocol: "https",
        hostname: "oxkxkqfwliobkyyexjtk.supabase.co",
        pathname: "/storage/v1/object/public/**",
      },
    ],
  },
  experimental: {
    // 상세 HTML 업로드가 서버 액션 인자로 실린다. 기본 1MB로는 512KB 본문 +
    // 나머지 폼 필드가 한도를 넘긴다. 업로드 상한은 별도로 512KB를 건다.
    serverActions: { bodySizeLimit: "2mb" },
  },
};

export default nextConfig;
