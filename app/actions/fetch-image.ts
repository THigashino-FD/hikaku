"use server"

import { ALLOWED_HOSTNAMES, IMAGE_CONSTANTS } from '@/lib/constants';
import { logger, generateRequestId, withRequestContext, getCurrentMeta } from '@/lib/logger';
import { AppErrors, fromError, type AppError } from '@/lib/types/errors';

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
 * パブリックなドメイン名かどうかを簡易チェック
 * IPアドレス（プライベートIP以外）や通常のドメイン名を許可
 */
function isPublicDomain(hostname: string): boolean {
  // IPv4アドレス形式（プライベートIPは既にisPrivateIPでチェック済み）
  const ipv4Pattern = /^\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}$/
  if (ipv4Pattern.test(hostname)) {
    // パブリックIPアドレスの場合（プライベートIPチェック後なので許可）
    return true
  }
  
  // IPv6アドレス形式（簡易チェック）
  if (hostname.includes(':')) {
    return true
  }
  
  // 通常のドメイン名（少なくとも1つのドットを含む）
  // localhostや内部ドメインを除外するため、ドットを含むことを要求
  if (hostname.includes('.')) {
    // localhostや.localドメインは除外（すでにプライベートIPチェックで除外されているが念のため）
    if (hostname === 'localhost' || hostname.endsWith('.local')) {
      return false
    }
    return true
  }
  
  return false
}

/**
 * URLが許可されているかをチェック
 * 
 * セキュリティ方針:
 * - HTTPSのみ許可
 * - プライベートIPアドレスをブロック
 * - パブリックなドメイン名のHTTPS画像URLを許可（一般的なWebサイト対応）
 * - ホワイトリストに明示的に含まれるホストは優先的に許可
 * 
 * @returns AppError または null（成功時）
 */
function validateUrl(url: string): AppError | null {
  try {
    const urlObj = new URL(url)
    
    // HTTPSのみ許可
    if (urlObj.protocol !== 'https:') {
      return AppErrors.forbiddenUrl('HTTPSのみ許可されています')
    }
    
    // プライベートIPを拒否
    if (isPrivateIP(urlObj.hostname)) {
      return AppErrors.forbiddenUrl('プライベートIPアドレスは許可されていません')
    }
    
    // ホワイトリストに明示的に含まれるホストは許可
    const isHostAllowed = ALLOWED_HOSTNAMES.some(allowed => 
      urlObj.hostname === allowed || urlObj.hostname.endsWith('.' + allowed)
    )
    
    if (isHostAllowed) {
      return null
    }
    
    // ホワイトリストにない場合、パブリックなドメイン名であれば許可
    // （一般的なWebサイトの画像URLに対応）
    if (isPublicDomain(urlObj.hostname)) {
      return null
    }
    
    // その他の場合は拒否
    return AppErrors.forbiddenUrl(
      `許可されていないホストです。HTTPSのパブリックなドメイン名の画像URLを使用してください`
    )
  } catch {
    return AppErrors.invalidUrl(url)
  }
}

/**
 * 画像取得結果（成功時）
 */
export interface FetchImageSuccess {
  dataUrl: string
  contentType: string
  size: number
}

/**
 * 画像取得結果（統一エラーモデル使用）
 */
export type FetchImageResult = 
  | { success: true; data: FetchImageSuccess }
  | { success: false; error: AppError }

/**
 * 外部URLから画像を取得するServer Action
 * @param url 画像のURL（HTTPSのみ許可）
 * @returns 画像データ（Base64エンコードされたData URL）またはエラー
 */
export async function fetchImageAction(url: string): Promise<FetchImageResult> {
  // リクエストコンテキストで実行（requestIdをログに付与）
  return withRequestContext(
    { requestId: generateRequestId() },
    async () => {
      const meta = getCurrentMeta()
      logger.log(meta, 'fetchImageAction started:', { url: url.substring(0, 50) })
      
      try {
        // 入力検証
        if (!url || typeof url !== 'string') {
          logger.warn(meta, 'Invalid URL input')
          return { 
            success: false, 
            error: AppErrors.invalidUrl(url) 
          }
        }

        // URL検証
        const validationError = validateUrl(url)
        if (validationError) {
          logger.warn(meta, 'URL validation failed:', validationError.code)
          return { success: false, error: validationError }
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
            logger.warn(meta, 'Fetch failed:', response.status, response.statusText)
            return { 
              success: false, 
              error: AppErrors.fetchFailed(response.status, response.statusText) 
            }
          }

          // Content-Typeが画像であることを確認
          const contentType = response.headers.get('content-type')
          if (!contentType || !contentType.startsWith('image/')) {
            logger.warn(meta, 'Invalid content type:', contentType)
            return { 
              success: false, 
              error: AppErrors.invalidImageType(contentType || 'unknown') 
            }
          }

          // サイズ制限（IMAGE_CONSTANTS.MAX_SIZE_BYTES）
          const contentLength = response.headers.get('content-length')
          if (contentLength && parseInt(contentLength) > IMAGE_CONSTANTS.MAX_SIZE_BYTES) {
            const size = parseInt(contentLength)
            logger.warn(meta, 'Image too large (content-length):', size)
            return { 
              success: false, 
              error: AppErrors.imageTooLarge(size, IMAGE_CONSTANTS.MAX_SIZE_BYTES) 
            }
          }

          // Blobとして取得
          const blob = await response.blob()
          
          // 実際のサイズチェック
          if (blob.size > IMAGE_CONSTANTS.MAX_SIZE_BYTES) {
            logger.warn(meta, 'Image too large (actual size):', blob.size)
            return { 
              success: false, 
              error: AppErrors.imageTooLarge(blob.size, IMAGE_CONSTANTS.MAX_SIZE_BYTES) 
            }
          }
          
          const arrayBuffer = await blob.arrayBuffer()

          // Base64エンコードして返す
          const base64 = Buffer.from(arrayBuffer).toString('base64')
          const dataUrl = `data:${contentType};base64,${base64}`

          logger.log(meta, 'fetchImageAction succeeded:', { size: blob.size, contentType })
          return {
            success: true,
            data: {
              dataUrl,
              contentType,
              size: blob.size,
            }
          }
        } finally {
          clearTimeout(timeoutId)
        }
      } catch (error) {
        const appError = fromError(error)
        logger.error(meta, 'fetchImageAction failed:', { url: url.substring(0, 50), error: appError })
        return { success: false, error: appError }
      }
    }
  )
}

