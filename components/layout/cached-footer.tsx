"use cache"

import { Footer } from "./footer"

/**
 * Cache Components を使用した Footer のキャッシュ版
 * Server Component として実行され、ビルド時にキャッシュされる
 */
export async function CachedFooter() {
  return <Footer />
}

