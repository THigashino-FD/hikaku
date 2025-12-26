/**
 * バリデーション関連型とユーティリティ
 */

import { z } from 'zod'
import type { ApiError } from './api'

/**
 * Zodのバリデーションエラーを ApiError 形式に変換
 */
export function zodErrorToApiError(error: z.ZodError): ApiError {
  return {
    code: 'VALIDATION_ERROR',
    message: 'バリデーションエラー',
    details: error.format(),
    statusCode: 400,
  }
}

/**
 * 安全なパース（エラー時はApiError形式で返却）
 */
export function safeParse<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; error: ApiError } {
  const result = schema.safeParse(data)
  
  if (result.success) {
    return { success: true, data: result.data }
  }
  
  return {
    success: false,
    error: zodErrorToApiError(result.error),
  }
}

