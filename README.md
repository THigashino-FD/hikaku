# hikaku-editor（劇的ビフォー/アフターツール）

FREEDOM ARCHITECTS向けの改築プロジェクトレビューツール。改築前後の画像を直感的に比較できるWebアプリケーション。

## 主な機能

- **Before/After比較スライダー**: 改築前後の画像を直感的に比較
- **画像管理**: IndexedDBによるローカル画像保存・管理
- **CASE管理**: 複数の比較CASEを作成・編集・削除
- **デフォルトCASE**: 初回起動時に3つのサンプルCASEを自動作成
- **調整機能**: 画像のズーム（50-200%）・位置調整（±200px）
- **データ永続化**: ブラウザのIndexedDBでデータを保持
- **初期表示アニメーション**: CASE 01で自動リベールアニメーション（デモ）
- **レスポンシブデザイン**: モバイル・タブレット・デスクトップ対応
- **共有機能**: URLエンコードによるCASE共有

## 技術スタック

- **Next.js 16** (App Router)
- **React 19**
- **TypeScript**
- **Tailwind CSS 4**
- **IndexedDB** (idb)
- **Playwright** (E2Eテスト)

## セットアップ

### 依存関係のインストール

```bash
npm install
```

### 開発サーバーの起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 使い方

### 初回アクセス
1. トップページにアクセス
2. デフォルトで3つのCASE（01, 02, 03）が表示される
3. スライダーをドラッグしてBefore/Afterを比較

### CASE管理
1. 「管理ページ」ボタンをクリック
2. 「新規CASE追加」で新しいCASEを作成
3. 各CASEの「編集」からタイトル・画像・初期表示設定を変更

### 画像管理
1. 管理ページで「画像ライブラリ」をクリック
2. 「画像をアップロード」から画像を追加
3. CASE編集時に登録した画像を割り当て

## スクリプト

```bash
# 開発サーバー起動
npm run dev

# 本番ビルド
npm run build

# 本番サーバー起動
npm run start

# Lint実行
npm run lint

# E2Eテスト実行
npm test

# E2Eテスト（UIモード）
npm run test:ui

# E2Eテスト（ブラウザ表示）
npm run test:headed
```

## テスト

### E2Eテスト

PlaywrightによるE2Eテストを実装しています。

**カバレッジ:**
- 初期表示とデフォルトCASE（3テスト）
- CASE管理（6テスト）
- 画像ライブラリ（3テスト）
- データ永続性（2テスト）
- 閲覧ページの機能（2テスト）
- 新機能テスト（10テスト）
- レスポンシブデザイン（4テスト）

**テスト結果:**
- 全116テスト中112件成功（4件はskip設定）
- Chromium, Mobile Chrome, Mobile Safari, Tablet の全ブラウザで動作確認済み

**実行:**
```bash
npm test
```

詳細は [テスト不足レポート](./docs/reports/missing-tests-report.md) および [レスポンシブテスト結果](./docs/reports/e2e-responsive-test-results.md) を参照してください。

## ディレクトリ構造と命名規則

### ディレクトリ構造の詳細

本プロジェクトは Next.js App Router の標準構造に準拠し、機能別にファイルを整理しています。

```
hikaku-editor/
├── app/                    # Next.js App Router
│   ├── api/                # API Routes
│   │   ├── fetch-image/    # 画像取得API
│   │   └── og/             # OGP画像生成
│   ├── e2e/                # E2Eテスト専用ルート（本番では非公開）
│   ├── manage/             # 管理ページ
│   │   ├── e2e/            # 管理ページE2Eテスト用ルート
│   │   ├── layout.tsx      # 管理ページレイアウト
│   │   └── page.tsx        # 管理ページメイン
│   ├── share/              # 共有機能
│   │   └── [encoded]/      # 共有リンクページ
│   ├── actions/            # Server Actions
│   ├── layout.tsx          # ルートレイアウト
│   ├── page.tsx            # トップページ（閲覧）
│   └── error.tsx           # エラーページ
├── components/             # Reactコンポーネント
│   ├── layout/             # レイアウトコンポーネント
│   │   ├── cached-*.tsx    # Cache Components ("use cache")
│   │   ├── header.tsx      # ヘッダー
│   │   ├── footer.tsx      # フッター
│   │   └── ...
│   ├── ui/                 # UIコンポーネント（shadcn/ui）
│   │   ├── button.tsx
│   │   ├── input.tsx
│   │   └── ...
│   ├── before-after-slider.tsx  # 比較スライダー
│   ├── case-editor.tsx          # CASE編集
│   ├── case-viewer.tsx          # CASE表示
│   └── image-library.tsx        # 画像ライブラリ
├── lib/                    # ユーティリティとビジネスロジック
│   ├── types/              # 型定義（集約エクスポート）
│   │   ├── index.ts        # 一元エクスポート
│   │   ├── api.ts          # API型
│   │   ├── case.ts         # CASE型
│   │   ├── image.ts        # 画像型
│   │   ├── share.ts        # 共有型
│   │   ├── errors.ts       # エラー型
│   │   └── validation.ts   # バリデーション
│   ├── server/             # サーバーサイド専用ユーティリティ
│   │   └── shared-cases.ts # 共有CASE管理（将来実装用）
│   ├── db.ts               # IndexedDB操作
│   ├── init.ts             # 初期化処理
│   ├── share.ts            # 共有機能
│   ├── image-utils.ts      # 画像処理
│   ├── browser.ts          # ブラウザユーティリティ
│   ├── logger.ts           # ログ管理
│   └── ...
├── e2e/                    # E2Eテスト（Playwright）
│   ├── app.spec.ts         # メインテストスイート
│   ├── error-handling.spec.ts  # エラーハンドリング
│   ├── responsive.spec.ts      # レスポンシブ
│   └── ...
├── docs/                   # ドキュメント
│   ├── features/           # 機能仕様
│   └── reports/            # レポート・履歴
└── public/                 # 静的ファイル
    ├── samples/            # サンプル画像
    └── branding/           # ブランド資産
```

### 命名規則

本プロジェクトでは一貫した命名規則を採用しています。

#### ファイル名
- **コンポーネントファイル**: kebab-case（例: `before-after-slider.tsx`, `case-editor.tsx`）
- **ユーティリティファイル**: kebab-case（例: `api-helpers.ts`, `image-utils.ts`）
- **型定義ファイル**: kebab-case（例: `api.ts`, `case.ts`）
- **Next.js特殊ファイル**: Next.js規約に従う（`page.tsx`, `layout.tsx`, `error.tsx`）

#### コード内の命名
- **型名**: PascalCase（例: `CaseRecord`, `ImageRecord`, `SharedCaseData`）
- **インターフェース名**: PascalCase（例: `CaseEditorProps`, `ImageLibraryProps`）
- **関数名**: camelCase（例: `getAllCases`, `addImage`, `generateShareUrl`）
- **変数名**: camelCase（例: `caseRecord`, `imageData`）
- **定数名**: UPPER_SNAKE_CASE（例: `IMAGE_CONSTANTS`, `ALLOWED_HOSTNAMES`）
- **コンポーネント名**: PascalCase（例: `BeforeAfterSlider`, `CaseEditor`）

#### ディレクトリ名
- **機能別ディレクトリ**: kebab-case（例: `case-editor/`）
- **特殊ディレクトリ**: 目的に応じた命名
  - `ui/` - UIコンポーネント
  - `layout/` - レイアウトコンポーネント
  - `types/` - 型定義
  - `server/` - サーバーサイド専用

### インポートエイリアス

`tsconfig.json` で以下のパスエイリアスを定義しています：

- `@/*` - プロジェクトルート
  - 例: `import { CaseRecord } from '@/lib/types'`
  - 例: `import { Button } from '@/components/ui/button'`

### ベストプラクティス

1. **型定義は一元管理**: 新しい型は `lib/types/` に追加し、`lib/types/index.ts` からエクスポート
2. **コンポーネントは機能別に分離**: 大きなコンポーネントは適切に分割
3. **サーバー/クライアントの明示**: 必要に応じて `"use client"` / `"use server"` を使用
4. **テストは機能別に配置**: E2Eテストは `e2e/` ディレクトリに機能別ファイルとして配置

## データ構造（IndexedDB）

### images
```typescript
{
  id: string          // UUID
  name: string        // ファイル名
  type: string        // MIME type
  size: number        // サイズ（bytes）
  blob: Blob          // 画像データ
  width: number       // 幅
  height: number      // 高さ
  createdAt: number   // 作成日時
}
```

### cases
```typescript
{
  id: string                 // UUID
  title: string              // タイトル
  description?: string       // 説明
  order: number              // 並び順
  beforeImageId?: string     // Before画像ID
  afterImageId?: string      // After画像ID
  view: {
    before: { scale, x, y }  // 初期表示設定
    after: { scale, x, y }
  }
  createdAt: number
  updatedAt: number
}
```

## 注意事項

### データの永続性
- データはブラウザのIndexedDBに保存されます
- 別のブラウザ・端末では共有されません
- ブラウザのデータ削除で消える可能性があります
- WebKit（Safari）では、BlobをArrayBufferに変換して保存するため、互換性が確保されています

### 容量制限
- ブラウザのストレージ上限に依存
- 画像は自動で最適化されます（長辺2000px、画質90%）

### 推奨事項
- 定期的なデータバックアップ
- 画像は事前に適切なサイズに調整

### ブラウザ対応
- Chrome/Edge（Chromium）: 完全対応
- Safari（WebKit）: 完全対応（モバイル・タブレット含む）
- Firefox: 動作確認済み

## デプロイ

### Vercel（推奨）
```bash
npm run build
# Vercelにデプロイ
```

### 環境変数
不要（クライアントサイドのみで完結）

## ライセンス

This project is private and proprietary to FREEDOM ARCHITECTS.

## 変更履歴

詳細な変更履歴は [CHANGELOG.md](./CHANGELOG.md) を参照してください。

## ドキュメント

### 仕様・設定
- [実装仕様書](./docs/implementation.md)
- [デフォルトCASE設定](./docs/default-cases-setup.md)
- [動作確認チェックリスト](./docs/checklist.md)

### 機能仕様
- [共有機能](./docs/features/share.md)
- [初期スライダー位置機能](./docs/features/initial-slider-position.md)
- [新機能一覧](./docs/features/new-features.md)

### レポート
- [コードベース全体調査レポート](./docs/reports/code-audit-report.md)
- [テスト不足レポート](./docs/reports/missing-tests-report.md)
- [不要なコード調査レポート](./docs/reports/unused-code-investigation-2025.md)
- [レスポンシブテスト結果](./docs/reports/e2e-responsive-test-results.md)
