# hikaku-editor（改築ビフォー/アフター比較ツール）

## 概要
FREEDOM ARCHITECTS向けの改築プロジェクトレビューツールです。改築前後の画像を直感的に比較でき、画像はブラウザのIndexedDBにローカル保存されます。

## 新機能（実装完了）

### ✅ 画像アップロード機能
- 画像をブラウザ（IndexedDB）にアップロード・保存
- 自動リサイズ・最適化（長辺2000px、画質90%）
- サポート形式：JPEG、PNG、GIF、WebP

### ✅ 管理ページ（`/manage`）
- **CASE管理**
  - 追加・編集・削除・複製
  - 並び順の変更（上下移動）
  - タイトル・説明の編集
  - Before/After画像の割り当て
  - 初期ズーム・位置の設定

- **画像ライブラリ**
  - 画像の一覧表示（サムネ、サイズ、寸法）
  - 画像の削除（使用中の場合は警告）
  - 検索機能
  - 使用状況の表示
  - 全データ削除

### ✅ 閲覧ページ（`/`）の改良
- IndexedDBからCASEを動的に読み込み
- CASE数に応じた表示（0件の場合は導線表示）
- 調整値を初期表示として保存する機能

## ページ構成

```
/              → 閲覧ページ（比較スライダー表示）
/manage        → 管理ページ（CASE・画像管理）
```

## 主な機能

### 閲覧ページ（`/`）
- CASEごとのBefore/Afterスライダー比較
- 画像のズーム・位置調整（50%〜200%、±200px）
- 調整パネル（折りたたみ式）
- 調整値の保存（「初期表示として保存」ボタン）

### 管理ページ（`/manage`）

#### CASE管理
- 新規CASE追加
- CASE編集（タイトル、説明、画像、初期表示設定）
- CASE複製
- CASE削除
- 並び順変更
- プレビュー機能

#### 画像ライブラリ
- 複数画像の一括アップロード
- 画像一覧（サムネ、ファイル名、サイズ、寸法）
- 使用中CASE表示
- 画像検索
- 画像削除
- 全データリセット

## データ構造（IndexedDB）

### DB: `hikaku-editor`

#### Object Store: `images`
```typescript
{
  id: string          // UUID
  name: string        // ファイル名
  type: string        // MIME type
  size: number        // バイトサイズ
  blob: Blob          // 画像データ
  width: number       // 幅（px）
  height: number      // 高さ（px）
  createdAt: number   // 作成日時（timestamp）
}
```

#### Object Store: `cases`
```typescript
{
  id: string                // UUID
  title: string             // タイトル
  description?: string      // 説明
  order: number             // 並び順
  beforeImageId?: string    // Before画像ID
  afterImageId?: string     // After画像ID
  view: {
    before: { scale: number, x: number, y: number }
    after: { scale: number, x: number, y: number }
  }
  createdAt: number         // 作成日時
  updatedAt: number         // 更新日時
}
```

#### Object Store: `app`
```typescript
{
  key: string     // 設定キー
  value: any      // 設定値
}
```

## 使い方

### 1. 開発サーバー起動
```bash
npm run dev
```

### 2. 初回セットアップ
1. `http://localhost:3000` にアクセス
2. 「管理ページへ」をクリック
3. 「画像ライブラリ」から画像をアップロード
4. 「新規CASE追加」でCASEを作成
5. CASE編集でBefore/After画像を割り当て
6. 保存後、閲覧ページで確認

### 3. CASE編集
1. 管理ページで編集したいCASEの「編集」ボタン
2. タイトル・説明を入力
3. Before/After画像を選択
4. 初期表示設定を調整（任意）
5. プレビューで確認
6. 「保存」

### 4. 閲覧・調整
1. 閲覧ページでスライダーを動かして比較
2. 「縮尺・位置を調整」で詳細調整
3. 調整後「この設定を初期表示として保存」で保存

## 技術スタック

- **フレームワーク**: Next.js 16 (App Router)
- **UI**: React 19、Tailwind CSS 4、Radix UI
- **ストレージ**: IndexedDB (idb)
- **画像処理**: Canvas API
- **TypeScript**: 型安全な実装

## 注意事項

### データの永続性
- データはブラウザ（端末）ごとに保存されます
- 別ブラウザ・別端末では共有されません
- ブラウザのデータ削除で消える可能性があります

### 容量制限
- ブラウザのストレージ上限に依存
- 画像は自動で最適化されますが、大量保存には注意

### 推奨事項
- 定期的なバックアップ（将来実装予定：エクスポート機能）
- 画像は事前に適切なサイズに調整しておくと効率的

## 今後の拡張案

- [ ] データのエクスポート/インポート機能
- [ ] 画像のドラッグ&ドロップアップロード
- [ ] CASEのドラッグ&ドロップ並び替え
- [ ] CASEのグループ化・カテゴリ分け
- [ ] 印刷・PDFエクスポート
- [ ] コメント・注釈機能

## ライセンス

This project is private and proprietary to FREEDOM ARCHITECTS.

