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
};

export default nextConfig;
