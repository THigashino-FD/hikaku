# 初期スライダー位置・アニメーション選択機能

## 概要
管理ページで各CASEごとに「初期スライダー位置」と「アニメーション種別」を設定できる機能を実装しました。これにより、閲覧ページで最初に表示される際の見せ方を柔軟にカスタマイズできます。

## 実装内容

### 1. IndexedDBスキーマ拡張
- **DB VERSION**: 1 → 2 に更新
- **CaseRecord型の拡張**:
  - `initialSliderPosition: number` (0-100%) - 初期スライダー位置
  - `animationType: 'none' | 'demo'` - アニメーション種別

### 2. マイグレーション処理
- 既存データに対する自動マイグレーション実装
- デフォルト値:
  - `initialSliderPosition`: 50 (中央)
  - `animationType`: CASE 01のみ `'demo'`、それ以外は `'none'`

### 3. 管理ページUI追加
**CaseEditorコンポーネント** (`components/case-editor.tsx`)に以下を追加:

#### 初期スライダー位置設定
- スライダー (0-100%)
- リアルタイムプレビュー表示
- ガイドテキスト:
  - 0-29%: "Before中心"
  - 30-69%: "バランス"
  - 70-100%: "After中心"

#### アニメーション選択
- ラジオボタンによる2択:
  - **なし**: 初期位置で静止表示
  - **デモ**: 自動でBefore/Afterを見せる (約4秒)

### 4. 閲覧ページの対応
**BeforeAfterSliderコンポーネント** (`components/before-after-slider.tsx`)の修正:

- Props変更:
  - `enableAutoReveal` (削除) → `animationType` と `initialSliderPosition` に置き換え
- 初期位置の反映:
  - `useState(initialSliderPosition)` でスライダー初期値を設定
- アニメーションロジックの改善:
  - `animationType === 'demo'` の場合のみアニメーション実行
  - 初期位置を基準に ±18% の範囲で動作
  - タイムライン: `初期位置 → (右へ) → (左へ) → 初期位置` (4秒)

### 5. E2Eテスト追加
**新規テストケース** (`e2e/new-features.spec.ts`):

1. **管理ページで初期スライダー位置を変更できる**
   - 初期値50%の表示確認
   - UI要素の存在確認

2. **アニメーション設定を変更すると閲覧ページに反映される**
   - 「なし」設定時に静止表示されることを確認
   - アニメーション完了後の位置確認

3. **デフォルトでCASE 01はデモアニメーションが有効**
   - デフォルト状態でアニメーションが動作することを確認
   - アニメーション完了後に初期位置に戻ることを確認

## 技術的詳細

### アニメーションロジック
```typescript
// 初期位置を基準に左右に18%ずつ動く
const basePos = initialSliderPosition
const rightPos = Math.min(basePos + 18, 100)
const leftPos = Math.max(basePos - 18, 0)

// タイムライン（ms）
const keyframes = [
  { t: 0, pos: basePos },      // 開始位置
  { t: 300, pos: basePos },    // 300ms停止
  { t: 1400, pos: rightPos },  // After側へ移動
  { t: 1700, pos: rightPos },  // 300ms停止
  { t: 2800, pos: leftPos },   // Before側へ移動
  { t: 3100, pos: leftPos },   // 300ms停止
  { t: 4000, pos: basePos },   // 初期位置に戻る
]
```

### マイグレーション処理
```typescript
// v1 -> v2のマイグレーション
if (oldVersion < 2 && newVersion >= 2) {
  const caseStore = transaction.objectStore('cases');
  caseStore.openCursor().then(function migrateCursor(cursor) {
    if (!cursor) return;
    const record = cursor.value;
    
    if (record.initialSliderPosition === undefined) {
      record.initialSliderPosition = 50;
    }
    if (record.animationType === undefined) {
      record.animationType = record.order === 0 ? 'demo' : 'none';
    }
    
    cursor.update(record).then(() => cursor.continue().then(migrateCursor));
  });
}
```

## 使い方

### 管理ページでの設定
1. 管理ページで対象CASEの「編集」ボタンをクリック
2. 「初期表示設定」セクションで以下を設定:
   - **初期スライダー位置**: スライダーで0-100%の範囲で調整
   - **アニメーション**: 「なし」または「デモ」を選択
3. 「保存」ボタンをクリック

### 閲覧ページでの動作
- **初期位置**: 設定した位置でスライダーが表示される
- **アニメーション「デモ」**: 画像読み込み完了後、約4秒かけて自動でBefore/Afterを見せる
- **アニメーション「なし」**: 初期位置で静止表示

### 推奨設定例
- **Before中心に見せたい場合**: 初期位置20-30%、アニメーション「デモ」
- **After中心に見せたい場合**: 初期位置70-80%、アニメーション「デモ」
- **静的な比較**: 初期位置50%、アニメーション「なし」
- **トップCASE**: 初期位置50%、アニメーション「デモ」(デフォルト)

## テスト結果
- **全テスト**: 24 passed, 1 skipped
- **新機能テスト**: 10 passed
- **既存機能**: 影響なし

## 関連ファイル
- `lib/db.ts` - スキーマ定義・マイグレーション
- `lib/init.ts` - デフォルトCASE作成
- `app/manage/page.tsx` - CASE追加処理
- `components/case-editor.tsx` - 管理UI
- `app/page.tsx` - 閲覧ページ
- `components/before-after-slider.tsx` - スライダーコンポーネント
- `e2e/new-features.spec.ts` - E2Eテスト


