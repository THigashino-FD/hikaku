/**
 * アプリケーション全体で使用する定数
 */

/**
 * 画像処理の定数
 */
export const IMAGE_CONSTANTS = {
  /** 画像の最大サイズ（長辺、px） */
  MAX_DIMENSION: 2000,
  /** 画像品質（0-1） */
  QUALITY: 0.9,
  /** 画像サイズ上限（バイト） */
  MAX_SIZE_BYTES: 10 * 1024 * 1024, // 10MB
  /** 許可する画像形式 */
  ALLOWED_TYPES: ['image/jpeg', 'image/png', 'image/gif', 'image/webp'] as const,
} as const;

/**
 * 外部URLの許可ホスト
 * SSRF対策として、これらのホストのみ許可
 */
export const ALLOWED_HOSTNAMES = [
  'drive.google.com',
  'lh3.googleusercontent.com',
] as const;

/**
 * IndexedDBの設定
 */
export const DB_CONSTANTS = {
  /** データベース名 */
  NAME: 'hikaku-editor',
  /** 現在のバージョン */
  VERSION: 2,
  /** リトライ設定 */
  RETRY: {
    MAX_RETRIES: 3,
    DELAY_MS: 200,
    TIMEOUT_MS: 10000,
  },
} as const;

