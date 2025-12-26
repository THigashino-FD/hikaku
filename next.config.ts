import type { NextConfig } from "next";
import { ALLOWED_HOSTNAMES } from "./lib/constants";

const nextConfig: NextConfig = {
  // Cache Components を有効化（Next.js 16.1.0）
  // "use cache" ディレクティブを使用してServer Componentをキャッシュ可能に
  cacheComponents: true,
  images: {
    // next/imageの外部URL最適化は限定的に使用
    // 共有プレビュー等の外部URLは <img> タグで直接表示（SafeImageコンポーネント）
    // IndexedDB保存後のblob URLのみ next/image で最適化
    remotePatterns: ALLOWED_HOSTNAMES.map(hostname => ({
      protocol: 'https' as const,
      hostname,
    })),
    // SVGは使用しないため無効化
    dangerouslyAllowSVG: false,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
  // 静的コンテンツ（Header, Footer, ToolDescription）は "use cache" でキャッシュされ、
  // 動的コンテンツ（CasesSection）はSuspenseでストリーミング配信される
};

export default nextConfig;
