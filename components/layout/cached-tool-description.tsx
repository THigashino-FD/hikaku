"use cache"

import { ToolDescription } from "./tool-description"

/**
 * Cache Components を使用した ToolDescription のキャッシュ版
 * Server Component として実行され、ビルド時にキャッシュされる
 */
export async function CachedToolDescription() {
  return <ToolDescription />
}

