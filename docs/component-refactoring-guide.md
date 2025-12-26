# コンポーネント分割ガイドライン

作成日: 2025年12月26日

## 目的

本ドキュメントは、大きくなりすぎたコンポーネントを適切に分割するためのガイドラインを提供します。将来のリファクタリング作業の参考資料として使用してください。

## 背景

現在のコードベースには、以下の大きなコンポーネントが存在します：

1. [`components/before-after-slider.tsx`](../components/before-after-slider.tsx) - 840行
2. [`components/image-library.tsx`](../components/image-library.tsx) - 625行
3. [`components/manage-content.tsx`](../components/manage-content.tsx) - 473行
4. [`components/case-editor.tsx`](../components/case-editor.tsx) - 451行

これらのコンポーネントは複数の責務を持ち、保守性が低下しています。

## コンポーネント分割の基準

### いつ分割すべきか

以下のいずれかに該当する場合、コンポーネントの分割を検討してください：

1. **行数**: 300行を超える場合
2. **責務**: 3つ以上の明確な責務を持つ場合
3. **状態管理**: 10個以上のuseStateを持つ場合
4. **可読性**: スクロールしないと全体を把握できない場合
5. **再利用性**: 一部の機能を他の場所でも使いたい場合

### 分割の原則

1. **単一責任の原則**: 各コンポーネントは1つの明確な責務を持つ
2. **適切な粒度**: 小さすぎず、大きすぎず（100-300行が目安）
3. **状態の局所化**: 状態は必要な最小スコープで管理
4. **カスタムフックの活用**: ビジネスロジックはフックに分離
5. **テスタビリティ**: 分割後も既存のE2Eテストが動作すること

## 分割パターン

### パターン1: UI部品の分離

大きなUIを小さなコンポーネントに分割します。

**Before:**
```tsx
export function LargeComponent() {
  return (
    <div>
      {/* 100行のヘッダーUI */}
      {/* 200行のメインUI */}
      {/* 100行のフッターUI */}
    </div>
  )
}
```

**After:**
```tsx
// components/large-component/index.tsx
export function LargeComponent() {
  return (
    <div>
      <Header />
      <MainContent />
      <Footer />
    </div>
  )
}

// components/large-component/header.tsx
export function Header() { /* ... */ }

// components/large-component/main-content.tsx
export function MainContent() { /* ... */ }

// components/large-component/footer.tsx
export function Footer() { /* ... */ }
```

### パターン2: ロジックのフック化

状態管理とビジネスロジックをカスタムフックに分離します。

**Before:**
```tsx
export function Component() {
  const [state1, setState1] = useState()
  const [state2, setState2] = useState()
  // ... 10個のuseState
  
  const complexLogic = () => { /* 100行のロジック */ }
  
  return <div>{/* UI */}</div>
}
```

**After:**
```tsx
// components/component/index.tsx
export function Component() {
  const logic = useComponentLogic()
  return <div>{/* UI */}</div>
}

// components/component/hooks/use-component-logic.ts
export function useComponentLogic() {
  const [state1, setState1] = useState()
  const [state2, setState2] = useState()
  // ... 状態管理
  
  const complexLogic = () => { /* ロジック */ }
  
  return { state1, state2, complexLogic }
}
```

### パターン3: モード別の分離

異なるモードや状態で異なるUIを表示する場合、モード別にコンポーネントを分割します。

**Before:**
```tsx
export function Component() {
  const [mode, setMode] = useState<'view' | 'edit' | 'fullscreen'>('view')
  
  return (
    <div>
      {mode === 'view' && <div>{/* 100行 */}</div>}
      {mode === 'edit' && <div>{/* 100行 */}</div>}
      {mode === 'fullscreen' && <div>{/* 100行 */}</div>}
    </div>
  )
}
```

**After:**
```tsx
// components/component/index.tsx
export function Component() {
  const [mode, setMode] = useState<'view' | 'edit' | 'fullscreen'>('view')
  
  return (
    <div>
      {mode === 'view' && <ViewMode />}
      {mode === 'edit' && <EditMode />}
      {mode === 'fullscreen' && <FullscreenMode />}
    </div>
  )
}

// components/component/view-mode.tsx
export function ViewMode() { /* ... */ }

// components/component/edit-mode.tsx
export function EditMode() { /* ... */ }

// components/component/fullscreen-mode.tsx
export function FullscreenMode() { /* ... */ }
```

## 具体的な分割提案

### 1. before-after-slider.tsx（840行）

#### 現状の責務
- スライダー比較ロジック（メイン機能）
- フルスクリーン制御
- 調整パネル（ズーム、位置調整）
- アニメーション制御
- 画像読み込み状態管理

#### 推奨分割構造

```
components/
  ├── before-after-slider/
  │   ├── index.tsx                    # メインコンポーネント（200-250行）
  │   │   - スライダーのコア機能
  │   │   - 各サブコンポーネントの統合
  │   │
  │   ├── adjustment-panel.tsx         # 調整パネル（150行程度）
  │   │   - ズーム・位置調整UI
  │   │   - 入力フィールドとスライダー
  │   │
  │   ├── fullscreen-view.tsx          # フルスクリーン表示（150行程度）
  │   │   - フルスクリーンモードのUI
  │   │   - フルスクリーン固有の制御
  │   │
  │   ├── comparison-view.tsx          # 比較表示（150行程度）
  │   │   - スライダーモード
  │   │   - サイドバイサイドモード
  │   │
  │   └── hooks/
  │       ├── use-slider-state.ts      # スライダー状態管理
  │       │   - スライダー位置
  │       │   - ドラッグ状態
  │       │
  │       ├── use-image-transform.ts   # 画像変形ロジック
  │       │   - ズーム・位置の状態
  │       │   - 変形の計算ロジック
  │       │
  │       └── use-reveal-animation.ts  # アニメーション制御
  │           - アニメーション状態
  │           - requestAnimationFrame制御
```

#### 分割の優先順位
1. **高**: `adjustment-panel.tsx` - 独立性が高く、分離しやすい
2. **高**: `use-reveal-animation.ts` - アニメーションロジックの分離
3. **中**: `fullscreen-view.tsx` - フルスクリーン機能の分離
4. **低**: `use-slider-state.ts`, `use-image-transform.ts` - 細かい状態管理

### 2. image-library.tsx（625行）

#### 現状の責務
- 画像一覧表示
- 画像アップロード（ファイル・URL）
- 画像削除
- データ初期化
- 使用状況確認

#### 推奨分割構造

```
components/
  ├── image-library/
  │   ├── index.tsx                    # メインコンポーネント（200行程度）
  │   │   - レイアウト
  │   │   - モーダル制御
  │   │
  │   ├── image-upload-section.tsx     # アップロード機能（150行程度）
  │   │   - ファイルアップロード
  │   │   - URLからの取得
  │   │   - アップロード進捗表示
  │   │
  │   ├── image-grid.tsx               # 画像グリッド表示（150行程度）
  │   │   - 画像一覧
  │   │   - 画像カード
  │   │   - 削除ボタン
  │   │
  │   ├── data-management-section.tsx  # データ管理（100行程度）
  │   │   - 初期化ボタン
  │   │   - 統計情報
  │   │
  │   └── hooks/
  │       └── use-image-management.ts  # 画像管理ロジック
  │           - 画像の追加・削除
  │           - 使用状況確認
  │           - データ初期化
```

#### 分割の優先順位
1. **高**: `image-upload-section.tsx` - 独立した機能
2. **高**: `use-image-management.ts` - ビジネスロジックの分離
3. **中**: `image-grid.tsx` - 表示ロジックの分離
4. **低**: `data-management-section.tsx` - 小さな機能

### 3. manage-content.tsx（473行）

#### 推奨分割構造

```
components/
  ├── manage-content/
  │   ├── index.tsx                    # メインコンポーネント（150行程度）
  │   ├── case-list.tsx                # CASE一覧（150行程度）
  │   ├── share-dialog.tsx             # 共有ダイアログ（100行程度）
  │   └── hooks/
  │       └── use-case-management.ts   # CASE管理ロジック
```

### 4. case-editor.tsx（451行）

#### 推奨分割構造

```
components/
  ├── case-editor/
  │   ├── index.tsx                    # メインコンポーネント（150行程度）
  │   ├── basic-info-section.tsx       # 基本情報（100行程度）
  │   ├── image-selection-section.tsx  # 画像選択（100行程度）
  │   └── view-settings-section.tsx    # 表示設定（100行程度）
```

## 分割の実施手順

### ステップ1: 計画

1. 現在のコンポーネントの責務を列挙
2. 分割後の構造を設計
3. 状態の依存関係を分析
4. 影響範囲を確認（E2Eテストなど）

### ステップ2: 準備

1. 新しいディレクトリ構造を作成
2. 既存のE2Eテストを実行して、ベースラインを確立
3. Gitブランチを作成

### ステップ3: 分割実施

1. 最も独立性の高い部分から分割開始
2. 1つずつ段階的に分割（一度に全部やらない）
3. 各分割後にE2Eテストを実行して動作確認

### ステップ4: 検証

1. すべてのE2Eテストが通ることを確認
2. 手動でUIを確認
3. パフォーマンスに影響がないか確認

### ステップ5: リファクタリング

1. 重複コードの削除
2. 命名の統一
3. ドキュメントの更新

## 注意事項

### リスク

1. **テストの破損**: E2Eテストが特定のDOM構造に依存している場合、分割によって破損する可能性
2. **状態の複雑化**: 状態を複数のコンポーネント間で共有する場合、管理が複雑になる
3. **パフォーマンス**: 過度な分割は再レンダリングを増やす可能性

### 対策

1. **段階的な実施**: 一度に全部やらず、1つずつ分割
2. **テストの更新**: 分割に合わせてテストも更新
3. **React.memo**: 必要に応じてメモ化を使用
4. **Context API**: 深い階層での状態共有にはContextを検討

## まとめ

- コンポーネントは300行を目安に分割を検討
- 単一責任の原則に従う
- ビジネスロジックはカスタムフックに分離
- 段階的に実施し、各ステップでテストを実行
- 分割は手段であり、目的は保守性の向上

## 参考資料

- [React公式ドキュメント - コンポーネントの分割](https://react.dev/learn/thinking-in-react)
- [Clean Code in React](https://dev.to/thawkin3/clean-code-in-react-best-practices-4gn0)
- 本プロジェクトの関連ドキュメント:
  - [`docs/implementation.md`](./implementation.md)
  - [`docs/reports/code-audit-report.md`](./reports/code-audit-report.md)

