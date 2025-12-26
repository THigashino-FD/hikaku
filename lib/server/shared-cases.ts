/**
 * 共有CASEのサーバーサイドデータ操作（将来実装用）
 * 
 * 【注意】現在は未使用です。ローカル保持（IndexedDB）の方針のため、
 * URLベースの共有リンク（lib/share.ts）を使用しています。
 * 
 * 将来的にサーバーサイドで共有データを保存する機能を追加する場合は、
 * このファイルを実装してください。
 * 
 * セットアップ手順: docs/phase2-infrastructure-setup.md
 */

/**
 * TODO: インフラセットアップ後に以下を実装
 * 
 * 1. Vercel KV使用の場合:
 *    - `npm install @vercel/kv`
 *    - import { kv } from '@vercel/kv'
 * 
 * 2. Supabase使用の場合:
 *    - `npm install @supabase/supabase-js`
 *    - import { createClient } from '@supabase/supabase-js'
 */

import { type SharedCaseData } from '@/lib/share'

/**
 * 共有CASEをDBに保存
 * @param data 共有するCASEデータ
 * @returns 共有ID（例: "abc123"）
 */
export async function saveSharedCase(data: SharedCaseData): Promise<string> {
  // TODO: 実装
  // 1. ユニークなIDを生成（nanoid推奨）
  // 2. KVまたはDBに保存: kv.set(`share:${id}`, data)
  // 3. IDを返却
  
  throw new Error('saveSharedCase not implemented yet. Please setup Vercel KV or Supabase first.')
}

/**
 * 共有CASEをDBから取得（キャッシュ付き）
 * @param id 共有ID
 * @returns 共有CASEデータ、存在しない場合はnull
 */
export async function getSharedCase(id: string): Promise<SharedCaseData | null> {
  "use cache"
  
  // TODO: 実装
  // 1. KVまたはDBから取得: kv.get(`share:${id}`)
  // 2. データが存在しない場合はnullを返す
  // 3. "use cache" により、同じIDの取得は自動的にキャッシュされる
  
  throw new Error('getSharedCase not implemented yet. Please setup Vercel KV or Supabase first.')
}

/**
 * 共有CASEを削除（管理用）
 * @param id 共有ID
 */
export async function deleteSharedCase(id: string): Promise<void> {
  // TODO: 実装
  // KVまたはDBから削除: kv.del(`share:${id}`)
  
  throw new Error('deleteSharedCase not implemented yet. Please setup Vercel KV or Supabase first.')
}

/**
 * 共有CASEの一覧を取得（管理用）
 * @param limit 取得件数
 * @returns 共有CASEの配列
 */
export async function listSharedCases(limit: number = 100): Promise<Array<{ id: string; data: SharedCaseData; createdAt: number }>> {
  // TODO: 実装
  // KVまたはDBから一覧取得
  
  throw new Error('listSharedCases not implemented yet. Please setup Vercel KV or Supabase first.')
}

// ============================================
// Vercel KV実装例
// ============================================
/*
import { kv } from '@vercel/kv'
import { nanoid } from 'nanoid'

export async function saveSharedCase(data: SharedCaseData): Promise<string> {
  const id = nanoid(10) // 例: "V1StGXR8_Z"
  const caseData = {
    ...data,
    createdAt: Date.now(),
  }
  
  await kv.set(`share:${id}`, caseData, {
    ex: 60 * 60 * 24 * 30, // 30日間保持
  })
  
  return id
}

export async function getSharedCase(id: string): Promise<SharedCaseData | null> {
  "use cache"
  
  const data = await kv.get<SharedCaseData & { createdAt: number }>(`share:${id}`)
  
  if (!data) return null
  
  // createdAtを除外して返却
  const { createdAt, ...caseData } = data
  return caseData
}

export async function deleteSharedCase(id: string): Promise<void> {
  await kv.del(`share:${id}`)
}

export async function listSharedCases(limit: number = 100) {
  const keys = await kv.keys('share:*')
  const slicedKeys = keys.slice(0, limit)
  
  const cases = await Promise.all(
    slicedKeys.map(async (key) => {
      const id = key.replace('share:', '')
      const data = await kv.get<SharedCaseData & { createdAt: number }>(key)
      return { id, data: data!, createdAt: data!.createdAt }
    })
  )
  
  return cases.sort((a, b) => b.createdAt - a.createdAt)
}
*/

// ============================================
// Supabase実装例
// ============================================
/*
import { createClient } from '@supabase/supabase-js'
import { nanoid } from 'nanoid'

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.SUPABASE_SERVICE_ROLE_KEY!
)

export async function saveSharedCase(data: SharedCaseData): Promise<string> {
  const id = nanoid(10)
  
  const { error } = await supabase
    .from('shared_cases')
    .insert({
      id,
      data,
      created_at: new Date().toISOString(),
    })
  
  if (error) throw error
  
  return id
}

export async function getSharedCase(id: string): Promise<SharedCaseData | null> {
  "use cache"
  
  const { data, error } = await supabase
    .from('shared_cases')
    .select('data')
    .eq('id', id)
    .single()
  
  if (error || !data) return null
  
  return data.data as SharedCaseData
}

// Supabaseテーブル定義:
// CREATE TABLE shared_cases (
//   id TEXT PRIMARY KEY,
//   data JSONB NOT NULL,
//   created_at TIMESTAMPTZ DEFAULT NOW()
// );
*/

