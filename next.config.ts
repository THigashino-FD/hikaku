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
  // Partial Prerendering (PPR) はNext.js 16.1.0では実験的機能のため、
  // 代わりにSuspenseを使用してストリーミングを実装
  // 静的コンテンツ（Header, Footer, ToolDescription）はビルド時に生成され、
  // 動的コンテンツ（CasesSection）はSuspenseでストリーミング配信される
};

export default nextConfig;
