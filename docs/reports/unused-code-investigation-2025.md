# 不要なコード調査レポート（2025年1月）

調査日: 2025年1月

## 調査結果サマリー

本サービスのコードベースを詳細に調査した結果、以下の不要なコードが確認されました。

---

## 1. 未使用の依存関係パッケージ

### 高優先度（削除推奨）

以下のパッケージは、`package.json`に含まれていますが、コードベース内で**一切使用されていません**：

1. **`jspdf`** (^3.0.4) - PDF生成ライブラリ（未使用）
2. **`konva`** (^10.0.12) - 2Dキャンバスライブラリ（未使用）
3. **`react-konva`** (^19.2.1) - KonvaのReactバインディング（未使用）
4. **`vaul`** (^1.1.2) - ドロワーコンポーネント（未使用）
5. **`zod`** (3.25.76) - スキーマバリデーション（未使用）

**確認方法:**
- コードベース全体で`import`、`require`、`from`によるインポートを検索
- すべてのファイルで使用箇所が見つからなかった

**推定削減効果:**
- これらのパッケージを削除することで、`node_modules`のサイズを削減可能
- ビルド時間の短縮にも寄与

---

## 2. 未使用の関数

### `createCasesDataPromise` と `createManageDataPromise` (lib/data-loader.ts)

**問題点:**
- `lib/data-loader.ts`でエクスポートされているが、プロジェクト内のどこからも呼び出されていない
- コメントには「use()フック用」と記載されているが、実際には使用されていない
- 代わりに、`loadCasesData`と`loadManageData`が直接使用されている

**該当箇所:**
- `lib/data-loader.ts:74-76` - `createCasesDataPromise`の定義
- `lib/data-loader.ts:82-88` - `createManageDataPromise`の定義

**使用状況:**
- `loadCasesData` - `components/cases-list.tsx`で使用 ✅
- `loadManageData` - `components/manage-case-list.tsx`で使用 ✅
- `createCasesDataPromise` - 使用されていない ❌
- `createManageDataPromise` - 使用されていない ❌

**推奨対応:**
- 未使用のため関数を削除
- または、将来の使用予定がある場合はコメントで明記

---

## 3. 使用されている関数（確認済み）

以下の関数は実際に使用されているため、問題ありません：

- ✅ `loadCasesData` - `components/cases-list.tsx`で使用
- ✅ `loadManageData` - `components/manage-case-list.tsx`で使用
- ✅ `dataCache` - `components/cases-list.tsx`、`components/manage-case-list.tsx`で使用
- ✅ `withRetry` - `lib/data-loader.ts`、`components/cases-section.tsx`で使用
- ✅ `isWebKitBrowser` - `lib/browser.ts`内で`withRetry`から使用
- ✅ `sleep` - `lib/browser.ts`内で`withRetry`から使用、`lib/init.ts`でも使用
- ✅ `getImageById` - 複数のコンポーネントで使用
- ✅ `resetDBInstance` - `lib/init.ts`で動的インポートで使用
- ✅ `clearAllData` - `components/image-library.tsx`で使用
- ✅ `blobToFile` - `lib/image-utils.ts`内で`fetchAndResizeImage`から使用

---

## 4. 過去に削除済みの項目（参考）

以下の項目は過去の調査（2025-12-22）で削除されています：

### 4.1 未使用のプロップ

**`shareTitle` と `shareDescription` (components/before-after-slider.tsx)** ✅削除済み
- `BeforeAfterSlider`コンポーネントのプロップとして定義されていたが使用されていなかった
- `case-viewer.tsx`と`app/page.tsx`から受け渡しも削除

### 4.2 未使用の関数

**`getImageDimensions` (lib/image-utils.ts)** ✅削除済み
- プロジェクト内のどこからも呼び出されていなかった

**`isImageFile` (lib/image-utils.ts)** ✅削除済み
- 類似の`isAllowedImageType`が実際に使用されていたため削除

### 4.3 未使用の戻り値

**`originalWidth` と `originalHeight` (lib/image-utils.ts)** ✅削除済み
- `resizeImage`関数と`fetchAndResizeImage`関数の戻り値として定義されていたが、呼び出し側で使用されていなかった

### 4.4 誤解を招くコメント

**`before-after-slider.tsx` 内のコメント** ✅削除済み
- 存在しない関数を参照していたコメントを削除

### 4.5 未使用の型定義フィールド

**`comparisonMode` (lib/share.ts)** ✅削除済み
- `SharedCaseData`インターフェースに定義されていたが、実際の共有データでは使用されていなかった

---

## 推奨される対応優先度

### 高優先度（削除推奨）

1. **未使用の依存関係パッケージ**（5つ）
   - `jspdf`
   - `konva`
   - `react-konva`
   - `vaul`
   - `zod`
   
   **対応方法:**
   ```bash
   npm uninstall jspdf konva react-konva vaul zod
   ```

2. **未使用の関数**（2つ）
   - `createCasesDataPromise`
   - `createManageDataPromise`
   
   **対応方法:**
   - `lib/data-loader.ts`から該当関数を削除

---

## 注意事項

- 削除前に、各項目が本当に不要かを再確認してください
- 削除後は、ビルドエラーやテストエラーが発生しないことを確認してください
- 依存関係の削除は、`package-lock.json`も更新されるため、`npm install`を実行してください

---

## 調査方法

1. `package.json`の依存関係を確認
2. コードベース全体で各パッケージの使用箇所を検索（`grep`）
3. エクスポートされている関数の使用箇所を検索
4. 既存の調査レポートと照合

---

## 削除実施結果

### ✅ 完了（2025年1月）

1. **未使用の依存関係パッケージを削除** ✅
   - `jspdf`, `konva`, `react-konva`, `vaul`, `zod` を削除
   - `npm install` を実行し、46パッケージを削除
   - `package-lock.json` も自動更新

2. **未使用の関数を削除** ✅
   - `createCasesDataPromise` を削除
   - `createManageDataPromise` を削除
   - `lib/data-loader.ts` から削除完了

3. **ビルドとテストを実行して確認** ✅
   - `npm run lint` - エラーなし
   - `npm run build` - ビルド成功
   - すべての機能が正常に動作することを確認

### 削除効果

- **削除されたパッケージ数**: 5パッケージ（直接依存） + 41パッケージ（間接依存） = **合計46パッケージ**
- **削除された関数**: 2関数
- **コードベースのクリーンアップ**: 完了

