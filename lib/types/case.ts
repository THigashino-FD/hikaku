/**
 * CASEデータ型定義
 * Zodスキーマによるランタイムバリデーション付き
 */

import { z } from 'zod'

/**
 * ビュー設定のZodスキーマ
 */
export const ViewSettingsSchema = z.object({
  scale: z.number().min(50).max(200),
  x: z.number(),
  y: z.number(),
})

/**
 * CASEレコードのZodスキーマ
 */
export const CaseRecordSchema = z.object({
  id: z.string().uuid(),
  title: z.string().min(1).max(100),
  description: z.string().max(500).optional(),
  order: z.number().int().min(0),
  beforeImageId: z.string().uuid().optional(),
  afterImageId: z.string().uuid().optional(),
  view: z.object({
    before: ViewSettingsSchema,
    after: ViewSettingsSchema,
  }),
  initialSliderPosition: z.number().min(0).max(100),
  animationType: z.enum(['none', 'demo']),
  createdAt: z.number(),
  updatedAt: z.number(),
})

/**
 * ビュー設定型（Zodスキーマから推論）
 */
export type ViewSettings = z.infer<typeof ViewSettingsSchema>

/**
 * CASEレコード型（Zodスキーマから推論）
 */
export type CaseRecord = z.infer<typeof CaseRecordSchema>

/**
 * CASE作成時の入力型（IDとタイムスタンプを除外）
 */
export type CaseCreateInput = Omit<CaseRecord, 'id' | 'createdAt' | 'updatedAt'>

/**
 * CASE更新時の入力型（部分更新可能、IDは必須）
 */
export type CaseUpdateInput = Partial<CaseCreateInput> & { id: string }

