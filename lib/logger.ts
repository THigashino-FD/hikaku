/**
 * 本番環境では console を抑制するロギングユーティリティ
 * 
 * 開発時のデバッグログを本番環境では出力しないようにすることで、
 * パフォーマンス向上とセキュリティ強化を実現します。
 */

const isDevelopment = process.env.NODE_ENV === 'development';

/**
 * ログメタデータ（requestId など）
 */
export interface LogMeta {
  requestId?: string
  [key: string]: unknown
}

/**
 * メタデータを含むログメッセージをフォーマット
 */
function formatLog(meta: LogMeta | undefined, ...args: unknown[]): unknown[] {
  if (!meta || Object.keys(meta).length === 0) {
    return args
  }
  
  const metaStr = Object.entries(meta)
    .filter(([, value]) => value !== undefined)
    .map(([key, value]) => `${key}=${value}`)
    .join(' ')
  
  return [`[${metaStr}]`, ...args]
}

/**
 * 引数の最初がLogMetaかどうか判定
 */
function isLogMeta(arg: unknown): arg is LogMeta {
  return typeof arg === 'object' && arg !== null && !Array.isArray(arg)
}

/**
 * 引数を分解してmetaとargsに分ける
 */
function parseArgs(args: unknown[]): { meta: LogMeta | undefined; rest: unknown[] } {
  if (args.length > 0 && isLogMeta(args[0]) && ('requestId' in args[0] || Object.keys(args[0]).length === 0)) {
    return { meta: args[0], rest: args.slice(1) }
  }
  return { meta: undefined, rest: args }
}

export const logger = {
  /**
   * 開発環境のみで出力されるログ
   * デバッグ情報や進捗状況の確認に使用
   * 
   * @example
   * ```ts
   * logger.log({ requestId: 'req_123' }, 'メッセージ')
   * logger.log('メッセージ') // 後方互換
   * ```
   */
  log: (...args: unknown[]) => {
    if (!isDevelopment) return
    const { meta, rest } = parseArgs(args)
    console.log(...formatLog(meta, ...rest))
  },
  
  /**
   * 開発環境のみで出力される警告
   * 非推奨の使用や潜在的な問題の通知に使用
   */
  warn: (...args: unknown[]) => {
    if (!isDevelopment) return
    const { meta, rest } = parseArgs(args)
    console.warn(...formatLog(meta, ...rest))
  },
  
  /**
   * 本番環境でも出力されるエラーログ
   * システムエラーやユーザーに影響する問題の記録に使用
   */
  error: (...args: unknown[]) => {
    const { meta, rest } = parseArgs(args)
    console.error(...formatLog(meta, ...rest))
  },
  
  /**
   * 開発環境のみで出力される詳細ログ
   * より詳細なデバッグ情報に使用
   */
  debug: (...args: unknown[]) => {
    if (!isDevelopment) return
    const { meta, rest } = parseArgs(args)
    console.debug(...formatLog(meta, ...rest))
  },
} as const;

/**
 * requestId を生成（UUID v4 の簡易版）
 */
export function generateRequestId(): string {
  return `req_${Date.now()}_${Math.random().toString(36).substring(2, 9)}`
}

/**
 * 非同期コンテキスト（AsyncLocalStorage）用のストレージ
 * Server Actions や Route Handlers で requestId を保持
 */
let asyncLocalStorage: import('node:async_hooks').AsyncLocalStorage<LogMeta> | null = null

if (typeof window === 'undefined') {
  // サーバーサイドのみで AsyncLocalStorage を使用
  import('node:async_hooks').then((module) => {
    asyncLocalStorage = new module.AsyncLocalStorage<LogMeta>()
  }).catch(() => {
    // AsyncLocalStorage が利用できない環境（一部のエッジランタイム等）
    asyncLocalStorage = null
  })
}

/**
 * 現在のリクエストコンテキストのメタデータを取得
 */
export function getCurrentMeta(): LogMeta | undefined {
  if (asyncLocalStorage) {
    return asyncLocalStorage.getStore()
  }
  return undefined
}

/**
 * リクエストコンテキスト付きで関数を実行
 * Server Actions や Route Handlers でラップして使用
 * 
 * @example
 * ```ts
 * export async function GET(request: NextRequest) {
 *   return withRequestContext({ requestId: generateRequestId() }, async () => {
 *     logger.error(getCurrentMeta(), 'エラーが発生しました')
 *     // ...
 *   })
 * }
 * ```
 */
export async function withRequestContext<T>(
  meta: LogMeta,
  fn: () => Promise<T>
): Promise<T> {
  if (asyncLocalStorage) {
    return asyncLocalStorage.run(meta, fn)
  }
  // AsyncLocalStorage が利用できない場合は通常実行
  return fn()
}

