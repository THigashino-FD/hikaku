# API設計ガイド

**作成日**: 2025-12-26  
**対象読者**: 開発者  
**目的**: 統一的なAPI設計パターンとベストプラクティスを提供

---

## 概要

このプロジェクトでは、Zodによるランタイムバリデーションと統一的なAPIレスポンス形式を採用しています。これにより、型安全性・保守性・開発効率が大幅に向上します。

---

## 基本原則

### 1. 統一APIレスポンス形式

すべてのAPIエンドポイントは、以下の形式でレスポンスを返します：

```typescript
// 成功時
{
  success: true,
  data: T  // 実際のデータ
}

// エラー時
{
  success: false,
  error: {
    code: string,        // エラーコード
    message: string,     // ユーザー向けメッセージ
    details?: unknown,   // デバッグ用詳細情報
    statusCode: number   // HTTPステータスコード
  }
}
```

### 2. Zodによるバリデーション

すべての入力データはZodスキーマでバリデーションします。

### 3. 型推論の活用

Zodスキーマから型を推論し、型定義とバリデーションを一元管理します。

---

## 実装パターン

### API Route の実装

#### 基本テンプレート

```typescript
import { NextRequest } from 'next/server'
import { apiSuccess, apiError, ApiErrors } from '@/lib/api-helpers'
import { safeParse } from '@/lib/types'
import { z } from 'zod'

// 1. リクエストスキーマの定義
const MyRequestSchema = z.object({
  field1: z.string().min(1),
  field2: z.number().positive(),
})

// 2. レスポンスの型定義
interface MyResponse {
  result: string
}

// 3. API Routeの実装
export async function POST(request: NextRequest) {
  try {
    // 3-1. リクエストボディの取得
    const body = await request.json()
    
    // 3-2. バリデーション
    const validation = safeParse(MyRequestSchema, body)
    
    if (!validation.success) {
      return apiError(validation.error)
    }
    
    // 3-3. ビジネスロジック
    const result = await doSomething(validation.data)
    
    // 3-4. 成功レスポンス
    const responseData: MyResponse = {
      result: result,
    }
    
    return apiSuccess(responseData)
    
  } catch (error) {
    // 3-5. エラーハンドリング
    return apiError(ApiErrors.serverError(
      error instanceof Error ? error.message : undefined
    ))
  }
}
```

#### エラーハンドリングの例

```typescript
// カスタムエラーコード
if (notFound) {
  return apiError(ApiErrors.notFound('ユーザー'))
}

// カスタムエラー
if (customError) {
  return apiError({
    code: 'CUSTOM_ERROR',
    message: 'カスタムエラーが発生しました',
    details: { reason: 'some reason' },
    statusCode: 400,
  })
}
```

---

## クライアント側の実装

### API Clientの使用

```typescript
import { apiClient, isSuccess } from '@/lib/api-client'

// POST リクエスト
const response = await apiClient.post<MyResponse>('/api/endpoint', {
  field1: 'value',
  field2: 123,
})

if (isSuccess(response)) {
  // 成功時の処理（型安全！）
  console.log(response.data.result)
} else {
  // エラー時の処理（統一形式）
  console.error(response.error.message)
  console.error(response.error.code)
}
```

### React Componentでの使用例

```typescript
'use client'

import { useState } from 'react'
import { apiClient, isSuccess } from '@/lib/api-client'

export function MyComponent() {
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleSubmit = async (data: FormData) => {
    setLoading(true)
    setError(null)

    const response = await apiClient.post('/api/endpoint', {
      field1: data.get('field1'),
      field2: Number(data.get('field2')),
    })

    setLoading(false)

    if (isSuccess(response)) {
      // 成功処理
      alert('成功しました！')
    } else {
      // エラー表示
      setError(response.error.message)
    }
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <div className="error">{error}</div>}
      {/* form fields */}
      <button disabled={loading}>送信</button>
    </form>
  )
}
```

---

## 型定義の管理

### 型のインポート

すべての型は `@/lib/types` から単一インポート：

```typescript
import {
  // API共通型
  ApiResponse,
  ApiError,
  isSuccess,
  isError,
  
  // データ型
  CaseRecord,
  ImageRecord,
  SharedCaseData,
  
  // Zodスキーマ
  CaseRecordSchema,
  ImageRecordSchema,
  
  // バリデーション
  safeParse,
  zodErrorToApiError,
} from '@/lib/types'
```

### 新しい型の追加

1. `lib/types/` に新しいファイルを作成
2. Zodスキーマを定義
3. 型を推論
4. `lib/types/index.ts` でエクスポート

**例**: `lib/types/comment.ts`

```typescript
import { z } from 'zod'

export const CommentSchema = z.object({
  id: z.string().uuid(),
  caseId: z.string().uuid(),
  text: z.string().min(1).max(1000),
  createdAt: z.number(),
})

export type Comment = z.infer<typeof CommentSchema>

export type CommentCreateInput = Omit<Comment, 'id' | 'createdAt'>
```

**`lib/types/index.ts` に追加**:

```typescript
export type { Comment, CommentCreateInput } from './comment'
export { CommentSchema } from './comment'
```

---

## ベストプラクティス

### 1. バリデーションは必須

```typescript
// ❌ バリデーションなし
const body = await request.json()
const result = await doSomething(body.data)

// ✅ バリデーションあり
const validation = safeParse(MySchema, body)
if (!validation.success) {
  return apiError(validation.error)
}
const result = await doSomething(validation.data)
```

### 2. エラーコードを活用

```typescript
// ❌ 汎用エラーのみ
return apiError(ApiErrors.serverError())

// ✅ 具体的なエラーコード
return apiError({
  code: 'IMAGE_TOO_LARGE',
  message: '画像サイズが大きすぎます',
  statusCode: 413,
})
```

### 3. 型安全な応答

```typescript
// ❌ any型
const response: any = await apiClient.post('/api/endpoint', data)

// ✅ 型指定
interface MyResponse {
  id: string
  name: string
}

const response = await apiClient.post<MyResponse>('/api/endpoint', data)

if (isSuccess(response)) {
  console.log(response.data.name)  // 型安全！
}
```

### 4. エラーの詳細情報

```typescript
// 開発環境でのみ詳細情報を含める
return apiError({
  code: 'DATABASE_ERROR',
  message: 'データベースエラーが発生しました',
  details: process.env.NODE_ENV === 'development' ? error : undefined,
  statusCode: 500,
})
```

---

## テストの書き方

### API Routeのテスト

```typescript
import { test, expect } from '@playwright/test'

test('成功ケース', async ({ request }) => {
  const response = await request.post('/api/endpoint', {
    data: {
      field1: 'value',
      field2: 123,
    }
  })

  expect(response.status()).toBe(200)
  
  const data = await response.json()
  expect(data.success).toBe(true)
  expect(data.data.result).toBeTruthy()
})

test('エラーケース', async ({ request }) => {
  const response = await request.post('/api/endpoint', {
    data: {
      field1: '',  // 無効な値
    }
  })

  expect(response.status()).toBe(400)
  
  const data = await response.json()
  expect(data.success).toBe(false)
  expect(data.error.code).toBeTruthy()
  expect(data.error.message).toBeTruthy()
})
```

---

## エラーコード一覧

| コード | 説明 | HTTPステータス |
|--------|------|----------------|
| `INVALID_INPUT` | 入力データが不正 | 400 |
| `VALIDATION_ERROR` | バリデーションエラー | 400 |
| `NOT_FOUND` | リソースが見つからない | 404 |
| `UNAUTHORIZED` | 認証が必要 | 401 |
| `FORBIDDEN` | アクセス権限がない | 403 |
| `INTERNAL_ERROR` | サーバーエラー | 500 |
| `NETWORK_ERROR` | ネットワークエラー | 0 |
| `PAYLOAD_TOO_LARGE` | リクエストが大きすぎる | 413 |
| `TOO_MANY_REQUESTS` | レート制限超過 | 429 |

---

## 参考リソース

- [Zod公式ドキュメント](https://zod.dev/)
- [Next.js App Router](https://nextjs.org/docs/app)
- [TypeScript Handbook](https://www.typescriptlang.org/docs/handbook/)

---

**更新日**: 2025-12-26  
**バージョン**: 1.0.0

