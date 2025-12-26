/**
 * 画像データ型定義
 * Zodスキーマによるランタイムバリデーション付き
 */

import { z } from 'zod'

/**
 * 画像レコードのZodスキーマ
 */
export const ImageRecordSchema = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  type: z.string(),
  size: z.number().int().positive(),
  blob: z.instanceof(Blob).or(z.instanceof(ArrayBuffer)),
  width: z.number().int().positive(),
  height: z.number().int().positive(),
  sourceUrl: z.string().url().optional(),
  createdAt: z.number(),
})

/**
 * 画像レコード型（Zodスキーマから推論）
 */
export type ImageRecord = z.infer<typeof ImageRecordSchema>

/**
 * Blob型が保証された画像レコード型
 * API応答等でBlobとして返す場合に使用
 */
export type ImageRecordWithBlob = Omit<ImageRecord, 'blob'> & { blob: Blob }

