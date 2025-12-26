/**
 * 共有機能型定義
 * Zodスキーマによるランタイムバリデーション付き
 */

import { z } from 'zod'
import { ViewSettingsSchema } from './case'

/**
 * 共有CASEデータのZodスキーマ
 */
export const SharedCaseDataSchema = z.object({
  title: z.string().max(100).optional(),
  description: z.string().max(500).optional(),
  beforeUrl: z.string().url(),
  afterUrl: z.string().url(),
  initialSliderPosition: z.number().min(0).max(100),
  animationType: z.enum(['none', 'demo']),
  view: z.object({
    before: ViewSettingsSchema,
    after: ViewSettingsSchema,
  }),
})

/**
 * 共有CASEデータ型（Zodスキーマから推論）
 */
export type SharedCaseData = z.infer<typeof SharedCaseDataSchema>

