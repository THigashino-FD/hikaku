/**
 * ブラウザ判定ユーティリティ（クライアント専用）
 *
 * NOTE:
 * - iOS上のChrome/FirefoxもWebKitなので、ここでは「WebKit系=Safari問題が出やすい環境」として扱う。
 */

export function isWebKitBrowser(): boolean {
  if (typeof navigator === "undefined") return false
  const ua = navigator.userAgent.toLowerCase()
  // Chrome系（desktop/android）は除外。iOS Chrome は "crios" で "chrome" を含まないため WebKit 扱いになる。
  return ua.includes("webkit") && !ua.includes("chrome")
}

export function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms))
}

/**
 * リトライ付きで非同期関数を実行
 * @param fn 実行する非同期関数
 * @param options リトライオプション
 * @returns 関数の実行結果
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  options?: {
    maxRetries?: number
    delayMs?: number
    useWebKitRetries?: boolean
  }
): Promise<T> {
  const {
    maxRetries = 3,
    delayMs = 100,
    useWebKitRetries = true,
  } = options || {}

  const retries = useWebKitRetries && isWebKitBrowser() ? maxRetries : 1
  let lastError: unknown = null

  for (let attempt = 0; attempt < retries; attempt++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (attempt < retries - 1) {
        await sleep(delayMs * (attempt + 1))
      }
    }
  }

  throw lastError
}



