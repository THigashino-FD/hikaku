/**
 * 共有リンク用のデータ型定義とエンコード/デコード機能
 */

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
    // Base64エンコード（URL safe）
    const base64 = btoa(encodeURIComponent(json))
    return base64
  } catch (error) {
    console.error('Failed to encode shared case:', error)
    throw new Error('共有リンクの生成に失敗しました')
  }
}

/**
 * URLハッシュから共有データをデコード
 */
export function decodeSharedCase(encoded: string): SharedCaseData | null {
  try {
    const json = decodeURIComponent(atob(encoded))
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
  } catch (error) {
    console.error('Failed to decode shared case:', error)
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
 *  -> https://drive.google.com/uc?export=download&id=FILE_ID
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
      return `https://drive.google.com/uc?export=download&id=${fileId}`
    }
    
    return url
  } catch {
    return url
  }
}

/**
 * 共有リンクの完全なURLを生成
 */
export function generateShareUrl(data: SharedCaseData, baseUrl?: string): string {
  const base = baseUrl || (typeof window !== 'undefined' ? window.location.origin + window.location.pathname : '')
  const encoded = encodeSharedCase(data)
  return `${base}#share=${encoded}`
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
