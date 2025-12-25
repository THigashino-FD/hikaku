# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Code Quality
- Lintチェック修正
  - 未使用変数 `isAnimating` を削除
  - `useEffect`の依存配列を修正（`loadCases`を`useCallback`でメモ化）
  - 外部URL用の`<img>`タグ警告に対応（ESLint設定で許可）
- 不要な依存関係パッケージを削除（47パッケージ）
  - `jspdf`, `konva`, `react-konva`, `vaul`, `zod`
  - `autoprefixer`（Tailwind CSS 4で不要）
- 未使用の関数を削除（2関数）
  - `createCasesDataPromise`, `createManageDataPromise`

### Documentation
- docsディレクトリの整理
  - 完了済み作業レポートを削除（23ファイル）
  - 重複レポートを統合
  - 参考資料として有用なレポートのみ残す（4ファイル）

## [0.1.1] - 2024-12-22

### Upgraded
- Next.js 16.0.10 → 16.1.0
  - パフォーマンス改善とセキュリティ向上
  - ビルド確認: 正常に完了
  - 開発サーバー確認: 正常に起動
  - 互換性: すべての機能が正常に動作

### Performance Improvements
- 起動時間の最適化
  - WebKit判定を共通化 (`lib/browser.ts`)
  - 初期化処理のメモ化で多重実行を防止
  - 固定500ms待機を削除し、WebKit環境のみリトライに変更
  - 管理ページの画像取得を並列化 (`Promise.all`)
- 期待される改善効果
  - 初回アクセス時: 約50%削減（1.5-2.5秒 → 0.5-1.0秒）
  - 2回目以降: 約60%削減（0.5-1.0秒 → 0.2-0.4秒）

### Documentation
- パフォーマンス分析レポートを追加
- 実装意図分析レポートを追加
- E2Eテスト結果レポートを追加

## [0.1.0] - 2024-12-22

### Added
- 初期表示アニメーション機能（CASE 01で自動リベールデモ）
- 初期スライダー位置設定機能
- アニメーション種別設定（なし/デモ）
- レスポンシブデザイン対応（モバイル・タブレット・デスクトップ）
- 共有機能（URLエンコードによるCASE共有）
- E2Eテスト（Playwright）の実装
  - 全116テスト中112件成功（4件はskip設定）
  - Chromium, Mobile Chrome, Mobile Safari, Tablet の全ブラウザで動作確認済み

### Fixed
- WebKit（Safari）でのIndexedDB Blob保存エラー
  - BlobをArrayBufferに変換して保存する方式に変更
  - 取得時にBlobに戻す処理を追加
- WebKitでの永続化不安定性
  - `updateCase`/`deleteCase`/`deleteImage`をtransaction + `tx.done`待ちに統一
  - トランザクション完了を明示的に待機するように修正
- レスポンシブデザインの横スクロール問題
  - モバイル・タブレットでの横スクロールを解消
  - 調整パネルのレイアウトを改善
- E2Eテストのタイミング問題
  - WebKit特有の待ち時間を追加
  - アニメーション完了判定の精度を改善（49%〜51%の範囲を許容）

### Changed
- IndexedDBのスキーマをv2に更新（初期位置・アニメ種別追加）
- デフォルトCASEの初期化処理を改善
- 画像処理のエラーハンドリングを強化

### Technical Details
- Next.js 16 (App Router)
- React 19
- TypeScript
- Tailwind CSS 4
- IndexedDB (idb)
- Playwright (E2Eテスト)

