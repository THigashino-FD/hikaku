"use cache"

import { Header } from "./header"

/**
 * Cache Components を使用した Header のキャッシュ版
 * Server Component として実行され、ビルド時にキャッシュされる
 */
export async function CachedHeader() {
  return <Header />
}

