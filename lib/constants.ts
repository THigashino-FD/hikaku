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
 * 外部URLの許可ホスト（ホワイトリスト）
 * SSRF対策として、信頼できるホストのみを明示的に許可
 * 
 * セキュリティ方針:
 * - HTTPSのみ許可（プライベートIPは別途チェック）
 * - プライベートIPアドレスは別途ブロック（validateUrl関数内）
 * - パブリックなドメイン名のHTTPS画像URLを許可（一般的なWebサイト対応）
 * 
 * 注意: ホワイトリストにないホストでも、パブリックなHTTPSドメイン名であれば許可されます
 * （プライベートIPアドレスのみがブロックされます）
 */
export const ALLOWED_HOSTNAMES = [
  // Google系
  'drive.google.com',
  'lh3.googleusercontent.com',
  
  // 主要な画像ホスティングサービス
  'i.imgur.com',
  'imgur.com',
  'images.unsplash.com',
  'unsplash.com',
  'cdn.cloudinary.com',
  'res.cloudinary.com',
  'cloudinary.com',
  
  // 画像CDN
  'i.redd.it',
  'preview.redd.it',
  'external-preview.redd.it',
  'cdn.discordapp.com',
  'media.discordapp.net',
  
  // その他の主要サービス
  'pbs.twimg.com', // Twitter/X
  'abs.twimg.com',
  'githubusercontent.com',
  'raw.githubusercontent.com',
  
  // 一般的なCDN（画像配信を想定）
  'cdn.jsdelivr.net',
  'cdnjs.cloudflare.com',
  'images.ctfassets.net', // Contentful
  
  // 日本の不動産・住宅関連サイト
  'suumo.jp',
  'homes.co.jp',
  'at-home.co.jp',
  'chintai.net',
  'home.co.jp',
  'athome-vip.com', // アットホームの画像サーバー
  'image01.homes.co.jp', // HOME'Sの画像サーバー
  'image02.homes.co.jp',
  'image03.homes.co.jp',
  'image04.homes.co.jp',
  'image05.homes.co.jp',
  'image.suumo.jp', // SUUMOの画像サーバー
  'img01.suumo.jp',
  'img02.suumo.jp',
  'img03.suumo.jp',
  
  // 海外の不動産サイト
  'realtor.com',
  'zillow.com',
  'redfin.com',
  'century21.com',
  
  // 建築・住宅メーカー関連（主要な画像配信CDN）
  's3.amazonaws.com', // AWS S3（多くの企業が使用）
  's3-ap-northeast-1.amazonaws.com',
  'amazonaws.com',
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

