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



