/**
 * API共通型定義
 * 統一的なAPIレスポンス形式とエラーハンドリング
 */

/**
 * 統一APIレスポンス型
 * すべてのAPIエンドポイントはこの形式でレスポンスを返す
 */
export type ApiResponse<T> = 
  | { success: true; data: T }
  | { success: false; error: ApiError }

/**
 * APIエラー情報
 */
export interface ApiError {
  /** エラーコード（例: "INVALID_URL", "UNAUTHORIZED"） */
  code: string
  /** ユーザー向けエラーメッセージ */
  message: string
  /** デバッグ用詳細情報（本番環境では非表示推奨） */
  details?: unknown
  /** HTTPステータスコード */
  statusCode: number
}

/**
 * 成功レスポンスの型ガード
 */
export function isSuccess<T>(res: ApiResponse<T>): res is { success: true; data: T } {
  return res.success
}

/**
 * エラーレスポンスの型ガード
 */
export function isError<T>(res: ApiResponse<T>): res is { success: false; error: ApiError } {
  return !res.success
}

