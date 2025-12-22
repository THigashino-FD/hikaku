# 不要なコード・ファイル調査レポート（更新）

調査日: 2025年1月（2025-12-22 更新）

## 調査結果サマリー

本プロジェクトのコードベースを調査した結果、以下の不要なコードが確認され、**実際に削除/修正**しました。

## 1. 未使用のプロップ

### `shareTitle` と `shareDescription` (components/before-after-slider.tsx) ✅削除済み

**問題点:**
- `BeforeAfterSlider`コンポーネントのプロップとして定義されているが、コンポーネント内で実際には使用されていない
- `case-viewer.tsx`と`app/page.tsx`から渡されているが、コンポーネント内で参照されていない

**該当箇所:**
- `components/before-after-slider.tsx:26-27` - プロップ定義
- `components/case-viewer.tsx:139-140` - プロップを渡している
- `app/page.tsx:277-278` - プロップを渡している

**対応:**
- プロップ定義と、呼び出し側（`components/case-viewer.tsx`, `app/page.tsx`）での受け渡しを削除

## 2. 未使用の関数

### `getImageDimensions` (lib/image-utils.ts) ✅削除済み

**問題点:**
- 関数が定義されているが、プロジェクト内のどこからも呼び出されていない

**対応:**
- 未使用のため関数を削除

### `isImageFile` (lib/image-utils.ts) ✅削除済み

**問題点:**
- 関数が定義されているが、プロジェクト内のどこからも呼び出されていない
- 類似の`isAllowedImageType`が実際に使用されている

**対応:**
- 未使用のため関数を削除

## 3. 未使用の戻り値

### `originalWidth` と `originalHeight` (lib/image-utils.ts) ✅削除済み

**問題点:**
- `resizeImage`関数と`fetchAndResizeImage`関数が`originalWidth`と`originalHeight`を返しているが、呼び出し側で使用されていない
- 実際に使用されているのは`width`と`height`のみ

**該当箇所:**
- `lib/image-utils.ts:38-39, 83-84` - `resizeImage`の戻り値
- `lib/image-utils.ts:183-184` - `fetchAndResizeImage`の戻り値

**対応:**
- 呼び出し側で参照が無いため、戻り値の型と返却値から削除

## 4. 誤解を招くコメント

### `before-after-slider.tsx` 内の誤解を招くコメント ✅削除済み

**問題点:**
```typescript
// 共有リンク生成は buildShareLink / copyShareLink に統合
```
- `copyShareLink`は`app/manage/page.tsx`に存在するが、`buildShareLink`という関数は存在しない
- このコメントは誤解を招く可能性がある

**推奨対応:**
**対応:**
- コメントを削除

## 5. 未使用の型定義フィールド

### `comparisonMode` (lib/share.ts) ✅削除済み

**問題点:**
- `SharedCaseData`インターフェースに`comparisonMode?: 'slider' | 'sideBySide'`が定義されているが、実際の共有データでは使用されていない
- `before-after-slider.tsx`では`comparisonMode`はローカルステートとして管理されており、共有データには含まれていない

**対応:**
- 実データに含まれておらず参照も無いため型定義から削除（ドキュメント `docs/features/share.md` も追随）

## 6. 重複機能の可能性

### `getImageDimensionsFromBlob` (lib/init.ts:26-43) と `getImageDimensions` (lib/image-utils.ts:111-119)

**問題点:**
- 類似の機能を持つ2つの関数が存在する
- `getImageDimensionsFromBlob`は`lib/init.ts`で使用されている
- `getImageDimensions`は未使用

**推奨対応:**
- `getImageDimensions`を削除する（`getImageDimensionsFromBlob`が実際に使用されているため）

## 推奨される対応優先度

### 高優先度（削除推奨）
1. 未使用のプロップ `shareTitle` と `shareDescription`
2. 未使用の関数 `getImageDimensions` と `isImageFile`
3. 誤解を招くコメント（`before-after-slider.tsx:311`）

### 中優先度（整理推奨）
4. 未使用の戻り値 `originalWidth` と `originalHeight`
5. 未使用の型定義フィールド `comparisonMode`

### 低優先度（将来の拡張を考慮）
- 上記の項目で、将来の機能拡張で使用予定がある場合は、コメントで明記することを推奨

## 注意事項

- 削除前に、各項目が本当に不要かを再確認してください
- 削除後は、ビルドエラーやテストエラーが発生しないことを確認してください
- 型定義の削除は、TypeScriptの型チェックに影響する可能性があるため、慎重に行ってください

