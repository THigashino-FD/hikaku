/**
 * リトライ・タイムアウト制御ユーティリティ
 * アプリケーション全体で一貫したリトライポリシーを実現
 */

import { AppErrors, type AppError } from '@/lib/types/errors'
import { logger } from '@/lib/logger'

/**
 * リトライ設定
 */
export interface RetryConfig {
  /** 最大リトライ回数 */
  maxAttempts: number
  /** 初回リトライまでの待機時間（ミリ秒） */
  initialDelay: number
  /** リトライごとに遅延を増やす倍率（exponential backoff） */
  backoffMultiplier: number
  /** 最大遅延時間（ミリ秒） */
  maxDelay: number
  /** タイムアウト時間（ミリ秒、0の場合はタイムアウトなし） */
  timeout: number
  /** リトライ可能なエラーかどうかを判定する関数 */
  shouldRetry?: (error: unknown) => boolean
}

/**
 * デフォルトのリトライ設定
 */
export const DEFAULT_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 1000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  timeout: 10000,
  shouldRetry: (error: unknown) => {
    // AppError の場合は retryable フラグを参照
    if (typeof error === 'object' && error !== null && 'retryable' in error) {
      return (error as AppError).retryable
    }
    // その他のネットワークエラーはリトライ可能
    if (error instanceof Error) {
      return error.name === 'AbortError' || 
             error.name === 'TypeError' ||
             error.message.includes('fetch')
    }
    return false
  }
}

/**
 * 外部画像取得用のリトライ設定（より寛容）
 */
export const IMAGE_FETCH_RETRY_CONFIG: RetryConfig = {
  maxAttempts: 3,
  initialDelay: 2000,
  backoffMultiplier: 2,
  maxDelay: 10000,
  timeout: 10000,
  shouldRetry: (error: unknown) => {
    if (typeof error === 'object' && error !== null && 'code' in error) {
      const appError = error as AppError
      // タイムアウト、ネットワークエラー、一時的なサーバーエラーはリトライ
      return appError.retryable
    }
    return DEFAULT_RETRY_CONFIG.shouldRetry!(error)
  }
}

/**
 * 遅延処理
 */
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms))
}

/**
 * リトライ実行結果
 */
export type RetryResult<T> = 
  | { success: true; data: T; attempts: number }
  | { success: false; error: AppError; attempts: number }

/**
 * タイムアウト付きでPromiseを実行
 */
async function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number,
  signal?: AbortSignal
): Promise<T> {
  if (timeoutMs <= 0) {
    return promise
  }

  const controller = new AbortController()
  const timeoutId = setTimeout(() => controller.abort(), timeoutMs)

  // 外部から渡されたシグナルも監視
  if (signal) {
    signal.addEventListener('abort', () => controller.abort())
  }

  try {
    // どちらかが先に完了/中断したら結果を返す
    const result = await Promise.race([
      promise,
      new Promise<never>((_, reject) => {
        controller.signal.addEventListener('abort', () => {
          reject(AppErrors.timeout())
        })
      })
    ])
    return result
  } finally {
    clearTimeout(timeoutId)
  }
}

/**
 * リトライ可能な非同期処理を実行
 * 
 * @param fn 実行する非同期関数
 * @param config リトライ設定（省略時はデフォルト）
 * @param signal キャンセル用AbortSignal（オプション）
 * @returns 実行結果
 * 
 * @example
 * ```ts
 * const result = await withRetry(
 *   async () => {
 *     const res = await fetch('https://example.com/image.jpg')
 *     return res.blob()
 *   },
 *   IMAGE_FETCH_RETRY_CONFIG
 * )
 * 
 * if (result.success) {
 *   console.log('成功:', result.data)
 * } else {
 *   console.error('失敗:', result.error.message)
 * }
 * ```
 */
export async function withRetry<T>(
  fn: () => Promise<T>,
  config: Partial<RetryConfig> = {},
  signal?: AbortSignal
): Promise<RetryResult<T>> {
  const cfg: RetryConfig = { ...DEFAULT_RETRY_CONFIG, ...config }
  let lastError: AppError | null = null
  let attempt = 0

  while (attempt < cfg.maxAttempts) {
    attempt++

    // キャンセルチェック
    if (signal?.aborted) {
      return {
        success: false,
        error: AppErrors.internalError('リクエストがキャンセルされました'),
        attempts: attempt
      }
    }

    try {
      logger.debug(`Retry attempt ${attempt}/${cfg.maxAttempts}`)
      
      // タイムアウト付きで実行
      const data = await withTimeout(fn(), cfg.timeout, signal)
      
      logger.debug(`Retry succeeded on attempt ${attempt}`)
      return { success: true, data, attempts: attempt }
      
    } catch (error: unknown) {
      // AppError に変換
      let appError: AppError
      if (typeof error === 'object' && error !== null && 'code' in error) {
        appError = error as AppError
      } else if (error instanceof Error) {
        if (error.name === 'AbortError') {
          appError = AppErrors.timeout()
        } else {
          appError = AppErrors.networkError(error.message)
        }
      } else {
        appError = AppErrors.internalError('不明なエラー', error)
      }

      lastError = appError
      logger.debug(`Retry attempt ${attempt} failed:`, appError.message)

      // リトライ可否判定
      const shouldRetry = cfg.shouldRetry ? cfg.shouldRetry(appError) : false
      
      // 最後の試行、またはリトライ不可の場合は即座に失敗
      if (attempt >= cfg.maxAttempts || !shouldRetry) {
        // デバッグレベルに変更（withFallbackで使用される場合、次の選択肢があるため）
        logger.debug(`Retry exhausted after ${attempt} attempts`)
        return { success: false, error: appError, attempts: attempt }
      }

      // 次のリトライまで待機（exponential backoff）
      const delayMs = Math.min(
        cfg.initialDelay * Math.pow(cfg.backoffMultiplier, attempt - 1),
        cfg.maxDelay
      )
      
      logger.debug(`Waiting ${delayMs}ms before retry...`)
      await delay(delayMs)
    }
  }

  // 到達しないはずだが念のため
  return {
    success: false,
    error: lastError || AppErrors.internalError('リトライに失敗しました'),
    attempts: attempt
  }
}

/**
 * 複数の非同期処理を順次実行し、最初に成功したものを返す
 * （fallback パターン: 優先度の高い順に試行）
 * 
 * @param fns 実行する非同期関数の配列（優先度順）
 * @param config リトライ設定（各関数に適用）
 * @returns 実行結果
 * 
 * @example
 * ```ts
 * const result = await withFallback([
 *   // 1. 優先度の高い方法を試す
 *   async () => await method1(),
 *   // 2. 失敗した場合のフォールバック
 *   async () => await method2()
 * ])
 * ```
 */
export async function withFallback<T>(
  fns: Array<() => Promise<T>>,
  config: Partial<RetryConfig> = {}
): Promise<RetryResult<T>> {
  const errors: AppError[] = []
  let totalAttempts = 0

  for (let i = 0; i < fns.length; i++) {
    logger.debug(`Trying fallback option ${i + 1}/${fns.length}`)
    
    const result = await withRetry(fns[i], config)
    totalAttempts += result.attempts

    if (result.success) {
      logger.debug(`Fallback succeeded on option ${i + 1}`)
      // 最初の選択肢以外で成功した場合は、警告ログ（フォールバックが動作したことを記録）
      if (i > 0) {
        logger.warn(`Fallback option ${i + 1} succeeded after ${i} previous attempts failed`)
      }
      return { ...result, attempts: totalAttempts }
    }

    errors.push(result.error)
    logger.debug(`Fallback option ${i + 1} failed:`, result.error.message)
  }

  // すべての選択肢が失敗した場合のみエラーログを出力
  const lastError = errors[errors.length - 1]
  logger.error(`All fallback options failed after ${totalAttempts} total attempts`, lastError)
  return {
    success: false,
    error: lastError,
    attempts: totalAttempts
  }
}

