/**
 * 共有リンク用のデータ型定義とエンコード/デコード機能
 * バージョニングにより後方互換性を確保
 */

import { ALLOWED_HOSTNAMES } from '@/lib/constants';
import { AppErrors, type AppError } from '@/lib/types/errors';

/**
 * 共有データのバージョン
 */
export const SHARE_DATA_VERSION = 1

export interface SharedCaseData {
  /** バージョン番号（将来の拡張に備えて） */
  version?: number
  title?: string
  description?: string
  beforeUrl: string
  afterUrl: string
  initialSliderPosition: number
  animationType: 'none' | 'demo'
  view: {
    before: {
      scale: number
      x: number
      y: number
    }
    after: {
      scale: number
      x: number
      y: number
    }
  }
}

/**
 * 共有データのエンコード結果
 */
export type EncodeResult = 
  | { success: true; encoded: string }
  | { success: false; error: AppError }

/**
 * 共有データのデコード結果
 */
export type DecodeResult = 
  | { success: true; data: SharedCaseData }
  | { success: false; error: AppError }

/**
 * 共有データをURLハッシュ用の文字列にエンコード
 */
export function encodeSharedCase(data: SharedCaseData): EncodeResult {
  try {
    // バージョン情報を追加
    const versionedData: SharedCaseData = {
      ...data,
      version: SHARE_DATA_VERSION,
    }
    
    const json = JSON.stringify(versionedData)
    // UTF-8バイト列に変換してからBase64エンコード
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode(json)
    // Uint8ArrayをBase64に変換
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
    const base64 = btoa(binaryString)
    // URL-safe Base64に変換（+ を - に、/ を _ に置き換え、末尾の = を削除）
    const encoded = base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
    return { success: true, encoded }
  } catch (error) {
    return { 
      success: false, 
      error: AppErrors.internalError('共有リンクの生成に失敗しました', error) 
    }
  }
}

/**
 * URLハッシュから共有データをデコード（バージョン対応）
 */
export function decodeSharedCase(encoded: string): DecodeResult {
  try {
    // Step 1: URL-safe Base64を通常のBase64に変換（- を + に、_ を / に置き換え）
    // パディング（=）を追加（Base64文字列の長さが4の倍数になるように）
    let base64 = encoded.replace(/-/g, '+').replace(/_/g, '/')
    while (base64.length % 4) {
      base64 += '='
    }
    
    // Step 2: Base64デコード
    const binaryString = atob(base64)
    
    // Step 3: バイナリ文字列をUint8Arrayに変換してUTF-8デコード
    const uint8Array = new Uint8Array(binaryString.length)
    for (let i = 0; i < binaryString.length; i++) {
      uint8Array[i] = binaryString.charCodeAt(i)
    }
    const decoder = new TextDecoder('utf-8')
    const json = decoder.decode(uint8Array)
    
    // Step 4: JSON parse
    const data = JSON.parse(json) as SharedCaseData
    
    // バージョンチェックと後方互換性処理
    const version = data.version || 0  // バージョンがない場合は0（旧形式）
    
    if (version > SHARE_DATA_VERSION) {
      // 未来のバージョン: 警告を出すが処理は続行
      console.warn(`Share data version ${version} is newer than supported version ${SHARE_DATA_VERSION}`)
    }
    
    // 必須フィールドの検証
    if (!data.beforeUrl || !data.afterUrl) {
      return { 
        success: false, 
        error: AppErrors.invalidShareData('画像URLが見つかりません') 
      }
    }
    
    // URLの形式チェック（https のみ許可）
    if (!isValidImageUrl(data.beforeUrl) || !isValidImageUrl(data.afterUrl)) {
      return { 
        success: false, 
        error: AppErrors.invalidShareData('HTTPSのURLのみ許可されています') 
      }
    }
    
    // バージョン0（旧形式）の場合はデフォルト値を補完
    if (version === 0) {
      // 将来的に必要になった場合のための処理（現在は不要）
    }
    
    return { success: true, data }
  } catch (error) {
    // Base64デコードエラーや JSON パースエラー
    if (error instanceof Error && 
        (error.name === 'InvalidCharacterError' || error.message.includes('JSON'))) {
      return { 
        success: false, 
        error: AppErrors.shareDecodeError() 
      }
    }
    return { 
      success: false, 
      error: AppErrors.invalidShareData('共有データの形式が不正です') 
    }
  }
}

/**
 * 画像URLの妥当性チェック
 */
export function isValidImageUrl(url: string): boolean {
  try {
    const parsed = new URL(url)
    // HTTPSのみ許可
    if (parsed.protocol !== 'https:') {
      return false
    }
    return true
  } catch {
    return false
  }
}

/**
 * Google DriveのURLを直接アクセス可能な形式に変換
 * 例: https://drive.google.com/file/d/FILE_ID/view
 *  -> https://drive.google.com/uc?export=view&id=FILE_ID
 */
export function convertGoogleDriveUrl(url: string): string {
  try {
    const parsed = new URL(url)
    
    // Google Driveのドメインチェック
    if (!parsed.hostname.includes('drive.google.com')) {
      return url
    }
    
    // /file/d/FILE_ID/view 形式からFILE_IDを抽出
    const match = url.match(/\/file\/d\/([^\/]+)/)
    if (match && match[1]) {
      const fileId = match[1]
      // export=viewを使用して画像を直接取得（export=downloadはHTMLページを返すことがある）
      const convertedUrl = `https://${ALLOWED_HOSTNAMES[0]}/uc?export=view&id=${fileId}`
      return convertedUrl
    }
    
    return url
  } catch {
    return url
  }
}

/**
 * 共有リンクの完全なURLを生成
 * @param data 共有データ
 * @param baseUrl ベースURL（省略時は現在のオリジン）
 * @param useSharePage 共有専用ページ（/share/[encoded]）を使用するか（デフォルト: true）
 */
export function generateShareUrl(data: SharedCaseData, baseUrl?: string, useSharePage: boolean = true): string | null {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const encodeResult = encodeSharedCase(data)
  
  if (!encodeResult.success) {
    return null
  }
  
  if (useSharePage) {
    // 新しい形式: /share/[encoded]（OG画像対応）
    return `${base}/share/${encodeResult.encoded}`
  } else {
    // 旧形式: #share=[encoded]（後方互換性のため残す）
    return `${base}#share=${encodeResult.encoded}`
  }
}

/**
 * 現在のURLから共有データを取得
 */
export function getSharedCaseFromUrl(): SharedCaseData | null {
  if (typeof window === 'undefined') return null
  
  const hash = window.location.hash
  if (!hash.startsWith('#share=')) return null
  
  const encoded = hash.substring(7) // '#share=' を除去
  const result = decodeSharedCase(encoded)
  return result.success ? result.data : null
}
