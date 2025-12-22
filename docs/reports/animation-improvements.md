# アニメーション改善レポート

## 実装日
2025年12月20日（改善版）

## 概要
ユーザーフィードバックに基づき、初期表示アニメーション（自動リベール）を以下の3点で改善しました。

---

## 改善内容

### 1. ⏱️ アニメーション速度の調整

**変更前**: 2秒間のアニメーション  
**変更後**: **4秒間**のゆったりとした自然な動き

**詳細**:
- **遅延**: 0.5秒 → **0.8秒**（少し長めに）
- **振幅**: 50% ± 20px → **50% ± 25px**（より大きな動き）
- **イージング**: `ease-in-out-cubic` → **`ease-in-out-sine`**（よりなめらか）
- **軌道**: 50% → 30% → 70% → 50% から **50% → 25% → 75% → 50%** に変更

**コード**:
```typescript
const duration = 4000 // 4秒間のアニメーション（2秒から延長）
const delay = 800 // 0.8秒の遅延（少し長めに）

// よりなめらかなイージング関数（ease-in-out-sine）
const easeInOutSine = (t: number) => {
  return -(Math.cos(Math.PI * t) - 1) / 2
}
```

**UX効果**:
- ✅ 目で追いやすい、優雅な動き
- ✅ プレミアム感のある演出
- ✅ 操作可能であることが明確に伝わる

---

### 2. 🖱️ クリック・ドラッグでアニメーション中断

**新機能**: アニメーション中にユーザーが操作すると即座に中断

**中断トリガー**:
1. **スライダーハンドルのドラッグ開始**
2. **スライダーコンテナのクリック**
3. **スライダーコンテナ内での任意の操作**

**実装**:
```typescript
const [isAnimating, setIsAnimating] = useState(false)
const [animationCancelled, setAnimationCancelled] = useState(false)
const animationFrameRef = useRef<number | null>(null)

// アニメーションをキャンセルする関数
const cancelAnimation = () => {
  if (animationFrameRef.current) {
    cancelAnimationFrame(animationFrameRef.current)
    animationFrameRef.current = null
  }
  setIsAnimating(false)
  setAnimationCancelled(true)
}

// ドラッグ開始時
const handleStart = () => {
  if (isAnimating) {
    cancelAnimation()
  }
  setIsDragging(true)
}

// クリック時
<div onClick={() => {
  if (isAnimating) {
    cancelAnimation()
  }
}}>
```

**UX効果**:
- ✅ ユーザーの意図を最優先
- ✅ アニメーションが「邪魔」にならない
- ✅ 操作への即座の反応でストレスフリー

---

### 3. 🎯 CASE 01（トップ）のみアニメーション有効化

**変更前**: 全てのCASE（01, 02, 03）でアニメーション  
**変更後**: **最初のCASE（CASE 01）のみ**アニメーション

**理由**:
- ファーストビューで「これは動かせる」と伝えれば十分
- 複数のアニメーションは視覚的にノイズになる
- パフォーマンス最適化（不要な計算を削減）

**実装**:
```typescript
// BeforeAfterSliderにenableAutoRevealプロップを追加
interface BeforeAfterSliderProps {
  // ... 他のプロップ
  enableAutoReveal?: boolean // 初期表示アニメーションを有効化するか
}

// app/page.tsxで最初のCASEにのみtrue
<BeforeAfterSlider
  // ... 他のプロップ
  enableAutoReveal={isFirst} // 最初のCASEのみアニメーション有効
/>
```

**UX効果**:
- ✅ ノイズのないクリーンな体験
- ✅ 視線が自然にトップのCASEに誘導される
- ✅ パフォーマンスの向上

---

## テスト結果

### E2Eテスト: 7/7 passed (41.4s) 🎉

```bash
Running 7 tests using 1 worker

✓ 初期表示アニメーション（自動リベール）が動作する
✓ アニメーション中にクリックすると中断される
✓ CASE 02とCASE 03にはアニメーションがない
✓ 画像の遅延読み込みとプレースホルダーが表示される
✓ フルスクリーンモードが動作する
✓ 比較モードの切替が動作する
✓ 調整パネル内の全ての新UIが表示される

7 passed (41.4s)
```

**新規追加テスト**:
1. ✅ アニメーション中にクリックすると中断される
2. ✅ CASE 02とCASE 03にはアニメーションがない

---

## 変更されたファイル

### コンポーネント
- `components/before-after-slider.tsx`
  - `enableAutoReveal` プロップ追加
  - アニメーション時間を4秒に延長
  - イージング関数を`ease-in-out-sine`に変更
  - クリック・ドラッグでの中断機能実装
  - アニメーション状態管理（`isAnimating`, `animationCancelled`）

### ページ
- `app/page.tsx`
  - 最初のCASEにのみ`enableAutoReveal={true}`を渡す

### テスト
- `e2e/new-features.spec.ts`
  - アニメーション時間を5秒に更新（0.8秒遅延 + 4秒アニメーション）
  - クリック中断テストを追加
  - CASE 02/03のアニメーション無効テストを追加

### 設定
- `playwright.config.ts`
  - baseURLをポート3000に戻す

---

## 技術的詳細

### アニメーションフロー

```
ページ読み込み
    ↓
両方の画像が読み込み完了
    ↓
0.8秒待機（初期遅延）
    ↓
4秒間のアニメーション
  50% → 25% (1.33秒)
  25% → 75% (1.33秒)
  75% → 50% (1.34秒)
    ↓
50%で停止
```

### 中断メカニズム

```
アニメーション中
    ↓
ユーザー操作検知
  - ドラッグ開始
  - クリック
    ↓
cancelAnimation()実行
  - requestAnimationFrameをキャンセル
  - isAnimatingをfalseに
  - animationCancelledをtrueに
    ↓
アニメーション即座に停止
ユーザー操作に反応
```

### パフォーマンス最適化

1. **requestAnimationFrame使用**: ブラウザのリフレッシュレートに同期
2. **条件付き実行**: `enableAutoReveal`がtrueのCASEのみ
3. **早期リターン**: 既にキャンセルされている場合はスキップ
4. **クリーンアップ**: useEffectのreturnでフレームをキャンセル

---

## 使い方

### 開発サーバー起動
```bash
npm run dev
# http://localhost:3000 でアクセス
```

### 確認方法
1. トップページ（`/`）を開く
2. **CASE 01のスライダーが自動的にゆっくり動く**（4秒間）
3. アニメーション中にスライダーをクリックまたはドラッグ → **即座に停止**
4. CASE 02, 03は静的（アニメーションなし）

### E2Eテスト実行
```bash
npm test e2e/new-features.spec.ts
```

---

## ビフォー/アフター比較

| 項目 | 変更前 | 変更後 |
|------|--------|--------|
| **アニメーション時間** | 2秒 | **4秒** ⏱️ |
| **遅延** | 0.5秒 | **0.8秒** |
| **振幅** | ±20% | **±25%** 📏 |
| **イージング** | ease-in-out-cubic | **ease-in-out-sine** 📈 |
| **中断機能** | なし | **クリック・ドラッグで中断** 🖱️ |
| **適用範囲** | 全CASE | **CASE 01のみ** 🎯 |

---

## ユーザーフィードバック対応

### 指摘事項
1. ✅ **「動きが早すぎる」** → 4秒に延長
2. ✅ **「自然な動きにしてほしい」** → ease-in-out-sineに変更
3. ✅ **「クリックしたら止まらない」** → 中断機能実装
4. ✅ **「全部動くとうるさい」** → CASE 01のみに限定

---

## 今後の拡張案

### さらなる改善
- [ ] **アニメーション速度のカスタマイズ**: ユーザー設定で調整可能に
- [ ] **オン/オフ切替**: 「アニメーションを再生しない」オプション
- [ ] **ループ再生**: 初回のみでなく、定期的に再生（オプション）

### アクセシビリティ
- [ ] **prefers-reduced-motion対応**: OSのモーション設定を尊重
- [ ] **キーボード操作での中断**: スペースキーやエンターキーで停止

---

## まとめ

✅ **4秒間のゆったりとした自然なアニメーション**  
✅ **クリック・ドラッグで即座に中断可能**  
✅ **CASE 01のみに限定してノイズレス**  
✅ **全E2Eテストが成功**

ユーザーフィードバックに基づく改善により、より洗練された、使いやすいUIになりました。アニメーションは「邪魔」ではなく「助け」として機能し、初めてのユーザーにも直感的に操作方法を伝えます。

---

**実装者**: AI Assistant  
**レビュアー**: ユーザー  
**テスト環境**: Next.js 16.0.10, Playwright 1.57.0  
**参考**: [MIETELL](https://mietell.com/)の洗練されたUX

