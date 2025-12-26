/**
 * 統一エラーモデル
 * アプリケーション全体で一貫したエラーハンドリングを実現
 */

/**
 * アプリケーションエラーの分類
 */
export enum ErrorCategory {
  /** バリデーションエラー（入力不正） */
  VALIDATION = 'VALIDATION',
  /** ネットワークエラー（接続失敗、タイムアウト） */
  NETWORK = 'NETWORK',
  /** 認証・認可エラー */
  AUTH = 'AUTH',
  /** リソース不足エラー（サイズ超過、レート制限） */
  RESOURCE = 'RESOURCE',
  /** 外部サービスエラー（CORS、外部API失敗） */
  EXTERNAL = 'EXTERNAL',
  /** サーバー内部エラー */
  INTERNAL = 'INTERNAL',
}

/**
 * 統一エラーインターフェース
 */
export interface AppError {
  /** エラーコード（例: "INVALID_URL", "TIMEOUT"） */
  code: string
  /** エラーカテゴリ */
  category: ErrorCategory
  /** ユーザー向けメッセージ */
  message: string
  /** 開発者向け詳細情報 */
  details?: unknown
  /** HTTPステータスコード（API使用時） */
  statusCode?: number
  /** リトライ可能か */
  retryable: boolean
  /** リトライ推奨の待機時間（ミリ秒） */
  retryAfter?: number
  /** ユーザーアクション推奨メッセージ */
  userAction?: string
}

/**
 * エラービルダー（流れるようなインターフェース）
 */
export class AppErrorBuilder {
  private error: Partial<AppError> = {
    retryable: false,
  }

  static create(code: string, category: ErrorCategory): AppErrorBuilder {
    return new AppErrorBuilder().withCode(code).withCategory(category)
  }

  withCode(code: string): this {
    this.error.code = code
    return this
  }

  withCategory(category: ErrorCategory): this {
    this.error.category = category
    return this
  }

  withMessage(message: string): this {
    this.error.message = message
    return this
  }

  withDetails(details: unknown): this {
    this.error.details = details
    return this
  }

  withStatusCode(statusCode: number): this {
    this.error.statusCode = statusCode
    return this
  }

  retryable(retryAfter?: number): this {
    this.error.retryable = true
    this.error.retryAfter = retryAfter
    return this
  }

  withUserAction(userAction: string): this {
    this.error.userAction = userAction
    return this
  }

  build(): AppError {
    if (!this.error.code || !this.error.category || !this.error.message) {
      throw new Error('AppError requires code, category, and message')
    }
    return this.error as AppError
  }
}

/**
 * よく使うエラーのプリセット
 */
export const AppErrors = {
  // ========== バリデーションエラー ==========
  invalidUrl: (url?: string): AppError =>
    AppErrorBuilder.create('INVALID_URL', ErrorCategory.VALIDATION)
      .withMessage('無効なURL形式です')
      .withDetails({ url })
      .withStatusCode(400)
      .withUserAction('正しいURL形式で入力してください')
      .build(),

  forbiddenUrl: (reason: string): AppError =>
    AppErrorBuilder.create('FORBIDDEN_URL', ErrorCategory.VALIDATION)
      .withMessage(reason)
      .withStatusCode(403)
      .withUserAction('許可されたドメインのHTTPS URLを使用してください')
      .build(),

  invalidImageType: (contentType?: string): AppError =>
    AppErrorBuilder.create('INVALID_IMAGE_TYPE', ErrorCategory.VALIDATION)
      .withMessage('画像ではありません')
      .withDetails({ contentType })
      .withStatusCode(400)
      .withUserAction('JPEG、PNG、WebP形式の画像を使用してください')
      .build(),

  // ========== ネットワークエラー ==========
  timeout: (): AppError =>
    AppErrorBuilder.create('TIMEOUT', ErrorCategory.NETWORK)
      .withMessage('画像の取得がタイムアウトしました')
      .withStatusCode(504)
      .retryable(3000)
      .withUserAction('しばらく待ってから再試行してください')
      .build(),

  networkError: (details?: unknown): AppError =>
    AppErrorBuilder.create('NETWORK_ERROR', ErrorCategory.NETWORK)
      .withMessage('ネットワークエラーが発生しました')
      .withDetails(details)
      .withStatusCode(502)
      .retryable(5000)
      .withUserAction('インターネット接続を確認してください')
      .build(),

  fetchFailed: (statusCode?: number, statusText?: string): AppError =>
    AppErrorBuilder.create('FETCH_FAILED', ErrorCategory.NETWORK)
      .withMessage(`画像の取得に失敗しました${statusCode ? `: ${statusCode} ${statusText}` : ''}`)
      .withDetails({ statusCode, statusText })
      .withStatusCode(502)
      .retryable(3000)
      .withUserAction('URLが正しいか、画像が公開されているか確認してください')
      .build(),

  // ========== 外部サービスエラー ==========
  corsError: (): AppError =>
    AppErrorBuilder.create('CORS_ERROR', ErrorCategory.EXTERNAL)
      .withMessage('CORS（Cross-Origin）制約により画像を取得できません')
      .withStatusCode(403)
      .withUserAction('Google Driveの場合は共有設定を「リンクを知っている全員」にし、直接ダウンロードURLを使用してください')
      .build(),

  externalServiceError: (service: string, details?: unknown): AppError =>
    AppErrorBuilder.create('EXTERNAL_SERVICE_ERROR', ErrorCategory.EXTERNAL)
      .withMessage(`${service}からのデータ取得に失敗しました`)
      .withDetails(details)
      .withStatusCode(502)
      .retryable(5000)
      .build(),

  // ========== リソースエラー ==========
  imageTooLarge: (size?: number, maxSize?: number): AppError =>
    AppErrorBuilder.create('IMAGE_TOO_LARGE', ErrorCategory.RESOURCE)
      .withMessage(`画像サイズが大きすぎます（上限${maxSize ? `${Math.round(maxSize / 1024 / 1024)}MB` : '10MB'}）`)
      .withDetails({ size, maxSize })
      .withStatusCode(413)
      .withUserAction('画像サイズを縮小してください')
      .build(),

  rateLimitExceeded: (retryAfter?: number): AppError =>
    AppErrorBuilder.create('RATE_LIMIT_EXCEEDED', ErrorCategory.RESOURCE)
      .withMessage('リクエスト数が多すぎます')
      .withStatusCode(429)
      .retryable(retryAfter)
      .withUserAction('しばらく待ってから再試行してください')
      .build(),

  // ========== 共有リンクエラー ==========
  invalidShareData: (reason?: string): AppError =>
    AppErrorBuilder.create('INVALID_SHARE_DATA', ErrorCategory.VALIDATION)
      .withMessage(reason || '共有リンクの解析に失敗しました')
      .withStatusCode(400)
      .withUserAction('共有リンクが正しいか確認してください')
      .build(),

  shareDecodeError: (): AppError =>
    AppErrorBuilder.create('SHARE_DECODE_ERROR', ErrorCategory.VALIDATION)
      .withMessage('共有データの復号に失敗しました')
      .withStatusCode(400)
      .withUserAction('リンクが破損している可能性があります。再度共有リンクを生成してください')
      .build(),

  // ========== 内部エラー ==========
  internalError: (message?: string, details?: unknown): AppError =>
    AppErrorBuilder.create('INTERNAL_ERROR', ErrorCategory.INTERNAL)
      .withMessage(message || '予期しないエラーが発生しました')
      .withDetails(details)
      .withStatusCode(500)
      .withUserAction('問題が続く場合は管理者に連絡してください')
      .build(),
}

/**
 * Error オブジェクトから AppError を生成
 */
export function fromError(error: Error | unknown, defaultCategory: ErrorCategory = ErrorCategory.INTERNAL): AppError {
  if (error instanceof Error) {
    // AbortError（タイムアウト）の特別扱い
    if (error.name === 'AbortError') {
      return AppErrors.timeout()
    }

    // TypeError（ネットワークエラー、CORS含む）
    if (error.name === 'TypeError' && error.message.includes('Failed to fetch')) {
      return AppErrors.networkError(error.message)
    }

    // 一般的なエラー
    return AppErrorBuilder.create('UNKNOWN_ERROR', defaultCategory)
      .withMessage(error.message)
      .withDetails({ name: error.name, stack: error.stack })
      .withStatusCode(500)
      .build()
  }

  // 非Errorオブジェクト
  return AppErrorBuilder.create('UNKNOWN_ERROR', defaultCategory)
    .withMessage('不明なエラー')
    .withDetails(error)
    .withStatusCode(500)
    .build()
}

/**
 * AppError を API Error形式に変換
 */
export function toApiError(appError: AppError) {
  return {
    code: appError.code,
    message: appError.message,
    details: appError.details,
    statusCode: appError.statusCode || 500,
  }
}

/**
 * AppError をユーザー表示用の文字列に変換
 */
export function toUserMessage(appError: AppError): string {
  let message = appError.message
  
  if (appError.userAction) {
    message += `\n\n${appError.userAction}`
  }
  
  if (appError.retryable && appError.retryAfter) {
    const seconds = Math.ceil(appError.retryAfter / 1000)
    message += `\n（${seconds}秒後に再試行できます）`
  }
  
  return message
}

