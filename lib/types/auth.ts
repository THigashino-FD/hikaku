/**
 * 認証関連型定義（フェーズ3用）
 * Zodスキーマによるランタイムバリデーション付き
 */

import { z } from 'zod'

/**
 * ユーザー情報のZodスキーマ
 */
export const UserSchema = z.object({
  id: z.string().uuid(),
  email: z.string().email(),
  name: z.string().min(1).max(100).optional(),
  avatar: z.string().url().optional(),
  createdAt: z.number(),
})

/**
 * ユーザー型（Zodスキーマから推論）
 */
export type User = z.infer<typeof UserSchema>

/**
 * セッション情報のZodスキーマ
 */
export const SessionSchema = z.object({
  user: UserSchema,
  expiresAt: z.number(),
})

/**
 * セッション型（Zodスキーマから推論）
 */
export type Session = z.infer<typeof SessionSchema>

/**
 * ログインリクエストのZodスキーマ
 */
export const LoginRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
})

/**
 * ログインリクエスト型（Zodスキーマから推論）
 */
export type LoginRequest = z.infer<typeof LoginRequestSchema>

/**
 * サインアップリクエストのZodスキーマ
 */
export const SignupRequestSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(100),
  name: z.string().min(1).max(100).optional(),
})

/**
 * サインアップリクエスト型（Zodスキーマから推論）
 */
export type SignupRequest = z.infer<typeof SignupRequestSchema>

