import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // next/imageの外部URL最適化は限定的に使用
    // 共有プレビュー等の外部URLは <img> タグで直接表示（SafeImageコンポーネント）
    // IndexedDB保存後のblob URLのみ next/image で最適化
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'drive.google.com',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
      },
    ],
    // SVGは使用しないため無効化
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
};

export default nextConfig;
