# hikaku-editor（改築ビフォー/アフター比較ツール）

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

詳細は [E2Eテストレポート](./docs/reports/e2e-test-report.md) を参照してください。

## プロジェクト構成

```
hikaku-editor/
├── app/                      # Next.js App Router
│   ├── page.tsx             # トップページ（閲覧）
│   ├── manage/              
│   │   └── page.tsx         # 管理ページ
│   ├── layout.tsx           # ルートレイアウト
│   └── globals.css          # グローバルスタイル
├── components/              # Reactコンポーネント
│   ├── before-after-slider.tsx  # 比較スライダー
│   ├── case-editor.tsx          # CASE編集
│   ├── image-library.tsx        # 画像ライブラリ
│   └── ui/                      # UIコンポーネント
├── lib/                     # ユーティリティ
│   ├── db.ts                # IndexedDB操作
│   ├── init.ts              # 初期化処理
│   ├── share.ts             # 共有機能
│   └── image-utils.ts       # 画像処理
├── e2e/                     # E2Eテスト
│   └── app.spec.ts          # テストスイート
├── public/                  # 静的ファイル
│   ├── samples/             # サンプル画像
│   └── branding/            # ブランド資産
├── docs/                    # ドキュメント
│   ├── features/            # 機能仕様
│   └── reports/             # レポート・履歴
└── playwright.config.ts     # Playwright設定
```

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

### レポート・履歴
- [E2Eテストレポート](./docs/reports/e2e-test-report.md)
- [アニメーション最適化](./docs/reports/animation-optimization.md)
- [エラー修正履歴](./docs/reports/error-fixed-final.md)
