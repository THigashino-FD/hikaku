/**
 * データ取得関数
 * 管理ページなどで使用するデータ取得処理を提供
 */

import {
  getAllCases,
  getAllImages,
  getImageById,
  type CaseRecord,
  type ImageRecordWithBlob,
} from "@/lib/db"
import { initializeApp } from "@/lib/init"

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

