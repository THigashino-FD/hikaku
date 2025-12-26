# フェーズ2: Vercel KV セットアップガイド

このドキュメントは、フェーズ2（共有プレビューのサーバー化）に必要なVercel KVのセットアップ手順を説明します。

---

## 前提条件

- Vercelアカウント（無料プランでOK）
- プロジェクトがVercelにデプロイ済み

---

## セットアップ手順

### 1. Vercel KV の作成

1. [Vercel Dashboard](https://vercel.com/dashboard) にログイン
2. 左サイドバーから **Storage** を選択
3. **Create Database** をクリック
4. **KV** を選択
5. データベース名を入力（例: `hikaku-editor-kv`）
6. リージョンを選択（推奨: `iad1` - 東京に近い）
7. **Create** をクリック

### 2. プロジェクトへの接続

1. 作成したKVデータベースの詳細ページを開く
2. **Connect Project** をクリック
3. `hikaku-editor` プロジェクトを選択
4. **Connect** をクリック

### 3. 環境変数の確認

接続後、以下の環境変数が自動的に設定されます：

```
KV_REST_API_URL=https://...
KV_REST_API_TOKEN=...
KV_REST_API_READ_ONLY_TOKEN=...
```

### 4. ローカル環境への設定

`.env.local` ファイルを作成（既存の場合は追記）：

```bash
# Vercel KV
KV_REST_API_URL="https://..."
KV_REST_API_TOKEN="..."
KV_REST_API_READ_ONLY_TOKEN="..."
```

**注意**: `.env.local` は `.gitignore` に含まれているため、Gitにコミットされません。

### 5. 動作確認

次のコマンドでKVへの接続を確認：

```bash
npm install @vercel/kv
```

テストスクリプト（`scripts/test-kv.ts`）:

```typescript
import { kv } from '@vercel/kv'

async function testKV() {
  try {
    await kv.set('test-key', 'Hello from hikaku-editor!')
    const value = await kv.get('test-key')
    console.log('✅ KV connection successful:', value)
    await kv.del('test-key')
  } catch (error) {
    console.error('❌ KV connection failed:', error)
  }
}

testKV()
```

実行:

```bash
npx tsx scripts/test-kv.ts
```

---

## 代替: Supabase PostgreSQL

Vercel KVの代わりにSupabaseを使用する場合：

### 1. Supabase プロジェクト作成

1. [Supabase](https://supabase.com/) にサインアップ
2. **New Project** をクリック
3. プロジェクト名・リージョン・パスワードを設定
4. **Create Project** をクリック

### 2. 接続情報の取得

1. 左サイドバーから **Settings** → **Database** を選択
2. **Connection string** の **URI** をコピー

### 3. 環境変数の設定

`.env.local`:

```bash
DATABASE_URL="postgresql://..."
```

### 4. Prisma のインストール

```bash
npm install @prisma/client
npm install -D prisma
npx prisma init
```

---

## 次のステップ

セットアップ完了後、以下のファイルを実装します：

1. `lib/server/shared-cases.ts` - KV/DBアクセスロジック
2. `app/share/[id]/page.tsx` - 共有ページ
3. `app/api/share/route.ts` - 共有作成API

詳細は実装ガイドを参照してください。

---

## トラブルシューティング

### KV接続エラー

**症状**: `Error: KV_REST_API_URL is not defined`

**解決策**:
1. `.env.local` が正しく作成されているか確認
2. 開発サーバーを再起動: `npm run dev`

### ローカルでKVが使えない

**対処法**: Vercel KVはローカル開発でも使用可能ですが、接続が遅い場合があります。Redis Localを使用する選択肢もあります：

```bash
# Docker経由でRedisを起動
docker run -d -p 6379:6379 redis:alpine

# 環境変数を変更
KV_REST_API_URL="redis://localhost:6379"
```

---

**作成日**: 2025-12-26  
**更新日**: 2025-12-26

