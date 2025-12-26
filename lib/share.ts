/**
 * 共有リンク用のデータ型定義とエンコード/デコード機能
 */

import { ALLOWED_HOSTNAMES } from '@/lib/constants';

export interface SharedCaseData {
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
 * 共有データをURLハッシュ用の文字列にエンコード
 */
export function encodeSharedCase(data: SharedCaseData): string {
  try {
    const json = JSON.stringify(data)
    // UTF-8バイト列に変換してからBase64エンコード
    const encoder = new TextEncoder()
    const uint8Array = encoder.encode(json)
    // Uint8ArrayをBase64に変換
    const binaryString = Array.from(uint8Array, byte => String.fromCharCode(byte)).join('')
    const base64 = btoa(binaryString)
    // URL-safe Base64に変換（+ を - に、/ を _ に置き換え、末尾の = を削除）
    return base64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '')
  } catch {
    throw new Error('共有リンクの生成に失敗しました')
  }
}

/**
 * URLハッシュから共有データをデコード
 */
export function decodeSharedCase(encoded: string): SharedCaseData | null {
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
    
    // 必須フィールドの検証
    if (!data.beforeUrl || !data.afterUrl) {
      throw new Error('Invalid shared case data: missing image URLs')
    }
    
    // URLの形式チェック（https のみ許可）
    if (!isValidImageUrl(data.beforeUrl) || !isValidImageUrl(data.afterUrl)) {
      throw new Error('Invalid image URLs: only HTTPS URLs are allowed')
    }
    
    return data
  } catch {
    return null
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
export function generateShareUrl(data: SharedCaseData, baseUrl?: string, useSharePage: boolean = true): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin : '')
  const encoded = encodeSharedCase(data)
  
  if (useSharePage) {
    // 新しい形式: /share/[encoded]（OG画像対応）
    return `${base}/share/${encoded}`
  } else {
    // 旧形式: #share=[encoded]（後方互換性のため残す）
    return `${base}#share=${encoded}`
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
  return decodeSharedCase(encoded)
}
