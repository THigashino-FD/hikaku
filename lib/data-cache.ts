/**
 * クライアントサイドデータキャッシュ管理
 * IndexedDB取得結果をメモリにキャッシュし、不要な再取得を防ぐ
 */

import type { CaseRecord, ImageRecordWithBlob } from "@/lib/db"

interface CacheEntry<T> {
  data: T
  timestamp: number
}

class DataCache {
  private casesCache: CacheEntry<CaseRecord[]> | null = null
  private imagesCache: CacheEntry<ImageRecordWithBlob[]> | null = null
  private readonly TTL = 5 * 60 * 1000 // 5分間有効

  /**
   * CASEデータをキャッシュに保存
   */
  setCases(cases: CaseRecord[]): void {
    this.casesCache = {
      data: cases,
      timestamp: Date.now(),
    }
  }

  /**
   * CASEデータをキャッシュから取得
   */
  getCases(): CaseRecord[] | null {
    if (!this.casesCache) return null
    
    const age = Date.now() - this.casesCache.timestamp
    if (age > this.TTL) {
      this.casesCache = null
      return null
    }
    
    return this.casesCache.data
  }

  /**
   * 画像データをキャッシュに保存
   */
  setImages(images: ImageRecordWithBlob[]): void {
    this.imagesCache = {
      data: images,
      timestamp: Date.now(),
    }
  }

  /**
   * 画像データをキャッシュから取得
   */
  getImages(): ImageRecordWithBlob[] | null {
    if (!this.imagesCache) return null
    
    const age = Date.now() - this.imagesCache.timestamp
    if (age > this.TTL) {
      this.imagesCache = null
      return null
    }
    
    return this.imagesCache.data
  }

  /**
   * CASEキャッシュを無効化
   */
  invalidateCases(): void {
    this.casesCache = null
  }

  /**
   * 画像キャッシュを無効化
   */
  invalidateImages(): void {
    this.imagesCache = null
  }

  /**
   * すべてのキャッシュを無効化
   */
  invalidateAll(): void {
    this.casesCache = null
    this.imagesCache = null
  }
}

// シングルトンインスタンス
export const dataCache = new DataCache()

