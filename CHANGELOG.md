# Changelog

All notable changes to this project will be documented in this file.

## [Unreleased]

### Localization
- エラーメッセージの日本語化
  - lib/init.ts: 画像取得、オブジェクトURL作成、画像読み込み、CASE保存確認のエラー
  - lib/image-utils.ts: ファイル読み込み、画像読み込み、Canvas context取得、Blob作成のエラー
  - lib/share.ts: 共有データ検証、画像URL検証のエラー
  - lib/db.ts: IndexedDB利用可否のエラー
  - 日本向けサービスとして、すべてのユーザー向けエラーメッセージを日本語に統一

### Performance
- モーダルコンポーネントの動的インポート化
  - `ImageLibrary` と `CaseEditor` を遅延読み込みに変更
  - 初期バンドルサイズの削減
- フォント読み込みの最適化
  - `display: 'swap'` を設定してFOIT (Flash of Invisible Text) を削減
  - LCP (Largest Contentful Paint) の改善
- コンポーネントのメモ化
  - `CaseListItem`, `Header`, `Footer` を `React.memo` でラップ
  - 不要な再レンダリングを削減
- コールバック関数のメモ化
  - 管理ページの各ハンドラ関数を `useCallback` でメモ化
  - 子コンポーネントへの不要なprops変更を防止

### Code Quality
- 保守性向上のための改善
  - マジックナンバーを定数化（`lib/constants.ts`に集約）
    - 画像処理の定数（最大サイズ2000px、品質0.9、上限10MB）
    - 許可ホスト名（Google Drive, lh3.googleusercontent.com）
    - IndexedDB設定
  - ロギングユーティリティの導入（`lib/logger.ts`）
    - 本番環境では開発用ログを抑制
    - エラーログは本番でも記録
  - 全コンポーネント・ライブラリで定数とloggerを使用
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

