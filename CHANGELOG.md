# Changelog

All notable changes to this project will be documented in this file.

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

