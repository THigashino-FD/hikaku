"use server"

import { ALLOWED_HOSTNAMES, IMAGE_CONSTANTS } from '@/lib/constants';
import { logger } from '@/lib/logger';

/**
 * プライベートIPアドレスかどうかを判定
 */
function isPrivateIP(hostname: string): boolean {
  // localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true
  }
  
  // プライベートIPv4範囲
  const privateIPv4Patterns = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./, // リンクローカル
  ]
  
  return privateIPv4Patterns.some(pattern => pattern.test(hostname))
}

/**
 * URLが許可されているかをチェック
 */
function isAllowedUrl(url: string): { allowed: boolean; error?: string } {
  try {
    const urlObj = new URL(url)
    
    // HTTPSのみ許可
    if (urlObj.protocol !== 'https:') {
      return { allowed: false, error: 'HTTPSのみ許可されています' }
    }
    
    // プライベートIPを拒否
    if (isPrivateIP(urlObj.hostname)) {
      return { allowed: false, error: 'プライベートIPアドレスは許可されていません' }
    }
    
    // 許可リストのホスト名のみ許可
    const isHostAllowed = ALLOWED_HOSTNAMES.some(allowed => 
      urlObj.hostname === allowed || urlObj.hostname.endsWith('.' + allowed)
    )
    
    if (!isHostAllowed) {
      return { 
        allowed: false, 
        error: `許可されていないホストです。許可されているホスト: ${ALLOWED_HOSTNAMES.join(', ')}` 
      }
    }
    
    return { allowed: true }
  } catch {
    return { allowed: false, error: '無効なURL形式です' }
  }
}

export interface FetchImageResult {
  dataUrl?: string
  contentType?: string
  size?: number
  error?: string
}

/**
 * 外部URLから画像を取得するServer Action
 * @param url 画像のURL（HTTPSのみ許可）
 * @returns 画像データ（Base64エンコードされたData URL）またはエラー
 */
export async function fetchImageAction(url: string): Promise<FetchImageResult> {
  try {
    if (!url || typeof url !== 'string') {
      return { error: 'URLが必要です' }
    }

    // URL検証
    const validation = isAllowedUrl(url)
    if (!validation.allowed) {
      return { error: validation.error || '許可されていないURLです' }
    }

    // 画像取得（タイムアウト設定）
    const controller = new AbortController()
    const timeoutId = setTimeout(() => controller.abort(), 10000) // 10秒タイムアウト
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      })
      
      clearTimeout(timeoutId)

      if (!response.ok) {
        return { error: `画像の取得に失敗しました: ${response.status} ${response.statusText}` }
      }

      // Content-Typeが画像であることを確認
      const contentType = response.headers.get('content-type')
      if (!contentType || !contentType.startsWith('image/')) {
        return { error: `画像ではありません (Content-Type: ${contentType})` }
      }

      // サイズ制限（IMAGE_CONSTANTS.MAX_SIZE_BYTES）
      const contentLength = response.headers.get('content-length')
      if (contentLength && parseInt(contentLength) > IMAGE_CONSTANTS.MAX_SIZE_BYTES) {
        return { error: '画像サイズが大きすぎます（上限10MB）' }
      }

      // Blobとして取得
      const blob = await response.blob()
      
      // 実際のサイズチェック
      if (blob.size > IMAGE_CONSTANTS.MAX_SIZE_BYTES) {
        return { error: '画像サイズが大きすぎます（上限10MB）' }
      }
      
      const arrayBuffer = await blob.arrayBuffer()

      // Base64エンコードして返す
      const base64 = Buffer.from(arrayBuffer).toString('base64')
      const dataUrl = `data:${contentType};base64,${base64}`

      return {
        dataUrl,
        contentType,
        size: blob.size,
      }
    } finally {
      clearTimeout(timeoutId)
    }
  } catch (error) {
    logger.error('Error fetching image:', error)
    
    if (error instanceof Error && error.name === 'AbortError') {
      return { error: '画像の取得がタイムアウトしました' }
    }
    
    return { error: error instanceof Error ? error.message : '不明なエラー' }
  }
}

