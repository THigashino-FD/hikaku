# 共有リンク機能

## 概要
画像URLと表示設定（ズーム/位置/初期スライダー位置/アニメーション等）をリンクで共有し、相手が「共有CASEとして保存」できる機能を実装しました。

**重要**: この機能は**サーバレス**で動作します。画像はユーザーが用意したURL（Google Drive等）を使用し、共有リンクには設定情報のみが含まれます。

## 使い方

### 1. 共有リンクの作成

1. 閲覧ページの任意のCASEで「縮尺・位置を調整」パネルを開く
2. 「画像のURL入力」セクションに、Before/Afterの画像URLを入力
   - **重要**: HTTPSのURLのみ許可されます
   - Google Driveの場合は後述の注意点を参照
3. 好みのズーム・位置・初期スライダー位置を設定
4. 「共有リンクを作成」ボタンをクリック
5. 生成された共有リンクが表示され、「コピー」ボタンでクリップボードにコピー

### 2. 共有リンクを開く

1. 共有リンクをブラウザで開く
2. 「共有プレビュー」セクションが表示され、設定された状態で画像が表示される
3. 「共有CASEとして保存」ボタンをクリック
4. 画像がURLから取得され、最適化（リサイズ）されてIndexedDBに保存される
5. 通常のCASEとして管理・閲覧できるようになる

## Google Drive画像の使用方法

### 推奨方法
Google Driveの画像を共有する場合、以下の手順で直接アクセス可能なURLを取得してください：

1. Google Driveで画像ファイルを右クリック → 「共有」
2. 「一般的なアクセス」を **「リンクを知っている全員」** に変更
3. ファイルIDをコピー（URLの`/file/d/FILE_ID/view`の`FILE_ID`部分）
4. 以下の形式でURLを作成:
   ```
   https://drive.google.com/uc?export=download&id=FILE_ID
   ```

### 注意事項
- 共有ページURL（`https://drive.google.com/file/d/FILE_ID/view`）は画像として直接取得できず、失敗する可能性があります
- アプリ内で自動変換を試みますが、確実性を高めるため上記の形式を使用することを推奨します
- ファイルの共有設定が「制限付き」の場合、画像の取得に失敗します

## 技術仕様

### 共有リンクの形式
```
https://your-domain/#share=BASE64_ENCODED_DATA
```

### 共有データ（SharedCaseData）
```typescript
{
  title?: string // タイトル
  description?: string // 説明
  beforeUrl: string // Before画像のURL（HTTPS必須）
  afterUrl: string // After画像のURL（HTTPS必須）
  initialSliderPosition: number // 初期スライダー位置（0-100%）
  animationType: 'none' | 'demo' // アニメーション種別
  comparisonMode?: 'slider' | 'sideBySide' // 比較モード
  view: {
    before: { scale: number; x: number; y: number }
    after: { scale: number; x: number; y: number }
  }
}
```

### エンコード/デコード
- **エンコード**: JSON → Base64URL
- **デコード**: Base64URL → JSON
- バリデーション: 必須フィールド（beforeUrl/afterUrl）とHTTPSチェック

### 画像取得と保存のフロー
1. 共有リンクから画像URLを取得
2. Google DriveのURLの場合、直接アクセス可能な形式に自動変換
3. `fetch`で画像を取得（CORS対応）
4. 既存の画像最適化機能（`fetchAndResizeImage`）で最大2000px、品質90%にリサイズ
5. IndexedDBの`images`ストアに保存
6. 新しいCASEレコードを作成し、`cases`ストアに保存

## セキュリティ考慮事項

### 実装済みの対策
- **HTTPSのみ許可**: HTTP URLは拒否
- **CORS制限**: ブラウザのCORS制限により、許可されていないドメインからの画像取得は失敗
- **コンテンツタイプチェック**: 取得したデータが画像形式でない場合はエラー

### 今後の検討事項（必要に応じて）
- **許可ドメインのホワイトリスト**: 社内運用の場合、信頼できるドメインのみ許可
- **画像サイズ制限の厳格化**: 巨大な画像によるメモリ消費の防止
- **レート制限**: 短時間での大量取得を制限

## 関連ファイル
- `lib/share.ts` - 共有リンクのエンコード/デコード、バリデーション
- `lib/image-utils.ts` - 画像の取得と最適化（`fetchAndResizeImage`）
- `components/before-after-slider.tsx` - 共有リンク生成UI
- `app/page.tsx` - 共有リンク読み込みとプレビュー、保存処理

## 制限事項
- **画像URLの有効期限**: 外部URLの有効期限が切れると、共有リンクから画像を取得できなくなります
- **CORS制限**: 一部のストレージサービスは CORS を許可していない場合があり、画像取得に失敗します
- **サーバレス**: 画像自体はリンクに含まれず、URLのみが共有されます
- **ブラウザ依存**: IndexedDBとクリップボードAPIを使用するため、古いブラウザでは動作しない可能性があります


