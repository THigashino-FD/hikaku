/**
 * APIヘルパー関数
 * 統一的なAPIレスポンス生成とエラーハンドリング
 */

import { NextResponse } from 'next/server'
import type { ApiResponse, ApiError } from '@/lib/types'

/**
 * 成功レスポンスを生成
 * @param data レスポンスデータ
 * @param status HTTPステータスコード（デフォルト: 200）
 */
export function apiSuccess<T>(data: T, status: number = 200): NextResponse {
  return NextResponse.json<ApiResponse<T>>(
    { success: true, data },
    { status }
  )
}

/**
 * エラーレスポンスを生成
 * @param error エラー情報
 */
export function apiError(error: Omit<ApiError, 'statusCode'> & { statusCode?: number }): NextResponse {
  const statusCode = error.statusCode ?? 500
  return NextResponse.json<ApiResponse<never>>(
    {
      success: false,
      error: { ...error, statusCode }
    },
    { status: statusCode }
  )
}

/**
 * よくあるエラーのプリセット
 */
export const ApiErrors = {
  /**
   * 入力データが不正
   */
  invalidInput: (details?: unknown): ApiError => ({
    code: 'INVALID_INPUT',
    message: '入力データが不正です',
    details,
    statusCode: 400,
  }),

  /**
   * リソースが見つからない
   */
  notFound: (resource: string = 'リソース'): ApiError => ({
    code: 'NOT_FOUND',
    message: `${resource}が見つかりません`,
    statusCode: 404,
  }),

  /**
   * 認証が必要
   */
  unauthorized: (): ApiError => ({
    code: 'UNAUTHORIZED',
    message: '認証が必要です',
    statusCode: 401,
  }),

  /**
   * アクセス権限がない
   */
  forbidden: (): ApiError => ({
    code: 'FORBIDDEN',
    message: 'アクセス権限がありません',
    statusCode: 403,
  }),

  /**
   * サーバーエラー
   */
  serverError: (message?: string): ApiError => ({
    code: 'INTERNAL_ERROR',
    message: message ?? 'サーバーエラーが発生しました',
    statusCode: 500,
  }),

  /**
   * リクエストのペイロードが大きすぎる
   */
  payloadTooLarge: (): ApiError => ({
    code: 'PAYLOAD_TOO_LARGE',
    message: 'リクエストデータが大きすぎます',
    statusCode: 413,
  }),

  /**
   * レート制限超過
   */
  tooManyRequests: (): ApiError => ({
    code: 'TOO_MANY_REQUESTS',
    message: 'リクエスト数が多すぎます。しばらく待ってから再試行してください',
    statusCode: 429,
  }),
}

