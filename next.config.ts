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
    // 상세 HTML 업로드 원본이 서버 액션 인자로 실린다. 업로드 상한은 5MB
    // (html-upload.tsx · actions.ts · 동반 테이블 CHECK가 같은 값)이고,
    // 여기에 나머지 폼 필드와 인코딩 여유를 더해 8mb로 잡는다.
    //
    // 이 값은 **모든 서버 액션에 걸린다** — 공개 문의 폼도 포함이다. 액션별
    // 한도는 Next에 없으므로, 더 올릴 일이 생기면 그 업로드만 서버 액션 대신
    // Storage 직접 업로드로 빼는 쪽을 먼저 본다(번들이 그 방식이다).
    serverActions: { bodySizeLimit: "8mb" },
  },
};

export default nextConfig;
