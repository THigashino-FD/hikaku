/**
 * Promiseベースのデータ取得関数
 * React 19のuse()フックと組み合わせて使用
 */

import {
  getAllCases,
  getAllImages,
  getImageById,
  type CaseRecord,
  type ImageRecordWithBlob,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"
import { withRetry } from "@/lib/browser"

/**
 * CASEデータを取得（リトライ対応）
 */
async function getAllCasesWithRetry(): Promise<CaseRecord[]> {
  return withRetry(() => getAllCases())
}

/**
 * 初期化とCASEデータの取得
 */
export async function loadCasesData(): Promise<CaseRecord[]> {
  // 初回起動時にデフォルトCASEをセットアップ
  await initializeApp()
  
  // WebKit環境では、初期化直後のIndexedDB取得が不安定なことがあるため、取得側で最小限リトライする
  const casesData = await getAllCasesWithRetry()
  return casesData
}

/**
 * 管理ページ用のデータ取得（CASEと画像を並列取得）
 */
export async function loadManageData(): Promise<{
  cases: CaseRecord[]
  images: ImageRecordWithBlob[]
  shareableStatus: Record<string, boolean>
}> {
  // 初回起動時にデフォルトCASEをセットアップ
  await initializeApp()
  
  const [casesData, imagesData] = await Promise.all([
    getAllCases(),
    getAllImages(),
  ])

  // 各CASEが共有可能かを判定
  const statusEntries = await Promise.all(
    casesData.map(async (c) => {
      const [beforeImage, afterImage] = await Promise.all([
        c.beforeImageId ? getImageById(c.beforeImageId) : Promise.resolve(null),
        c.afterImageId ? getImageById(c.afterImageId) : Promise.resolve(null),
      ])
      return [c.id, !!(beforeImage?.sourceUrl && afterImage?.sourceUrl)] as const
    })
  )
  const shareableStatus: Record<string, boolean> = Object.fromEntries(statusEntries)

  return {
    cases: casesData,
    images: imagesData,
    shareableStatus,
  }
}

