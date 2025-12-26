/**
 * 型定義のエクスポート
 * すべての型は '@/lib/types' から単一インポート可能
 * 
 * @example
 * import { ApiResponse, CaseRecord, ImageRecord } from '@/lib/types'
 */

// API共通型
export type { ApiResponse, ApiError } from './api'
export { isSuccess, isError } from './api'

// CASEデータ型
export type { ViewSettings, CaseRecord, CaseCreateInput, CaseUpdateInput } from './case'
export { ViewSettingsSchema, CaseRecordSchema } from './case'

// 画像データ型
export type { ImageRecord, ImageRecordWithBlob } from './image'
export { ImageRecordSchema } from './image'

// 共有機能型
export type { SharedCaseData } from './share'
export { SharedCaseDataSchema } from './share'

// 認証関連型（フェーズ3用）
export type { User, Session, LoginRequest, SignupRequest } from './auth'
export { UserSchema, SessionSchema, LoginRequestSchema, SignupRequestSchema } from './auth'

// バリデーション
export { zodErrorToApiError, safeParse } from './validation'

// エラー型
export type { AppError } from './errors'
export {
  ErrorCategory,
  AppErrorBuilder,
  AppErrors,
  fromError,
  toApiError,
  toUserMessage,
} from './errors'

