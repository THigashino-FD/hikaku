# アニメーション最適化レポート（最終版）

## 実装日
2025年12月20日（最適化版）

## 目的の再定義

**アニメーションの目的**: 「ユーザーがスライダーを動かせば、Before/Afterを理解できる」ことを伝える

この目的に対して、**最適な動かし方**を実装しました。

---

## 最適なアニメーション設計

### 従来の問題点
- **連続往復**: 50% → 25% → 75% → 50% の連続した動き
- **止まらない**: Before/Afterの切り替わりが認知しにくい
- **目的不明確**: 「何ができるか」が伝わりにくい

### 最適化後の設計
**"デモンストレーション型"アニメーション**

```
中央(50%)で一呼吸
    ↓ 1.1秒かけて移動
After側を多めに表示(68%)
    ↓ 0.3秒停止（ホールド）
    ↓ 1.1秒かけて移動
Before側を多めに表示(32%)
    ↓ 0.3秒停止（ホールド）
    ↓ 0.9秒かけて戻る
中央(50%)に戻る
```

**合計時間**: 約4秒（初期遅延なし、OS設定を尊重）

---

## 実装の特徴

### 1. 🎯 キーフレーム方式

**タイムライン定義**:
```typescript
const keyframes: Array<{ t: number; pos: number }> = [
  { t: 0, pos: 50 },      // 開始: 中央
  { t: 300, pos: 50 },    // 0.3秒: 中央で一呼吸
  { t: 1400, pos: 68 },   // 1.4秒: After側へ（+18%）
  { t: 1700, pos: 68 },   // 1.7秒: 停止（ホールド）
  { t: 2800, pos: 32 },   // 2.8秒: Before側へ（-36%）
  { t: 3100, pos: 32 },   // 3.1秒: 停止（ホールド）
  { t: 4000, pos: 50 },   // 4.0秒: 中央へ戻る
]
```

**メリット**:
- ✅ **止まる瞬間** があるので、Before/Afterの切り替わりが明確
- ✅ **ゆっくり動く** ので、目で追いやすい
- ✅ **1回のデモ** で完結するので、繰り返しのストレスがない

### 2. 🎨 ease-in-out-sine イージング

```typescript
const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2
```

- 自然で滑らかな加速・減速
- 機械的でない、人間的な動き

### 3. ♿ アクセシビリティ対応

```typescript
// OS設定で「視差効果を減らす」を尊重
const prefersReducedMotion =
  typeof window !== "undefined" &&
  window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
if (prefersReducedMotion) {
  return // アニメーションをスキップ
}
```

### 4. 🖱️ ユーザー操作での即時中断

- クリック、ドラッグで即座にアニメーション停止
- ユーザーの操作を最優先

### 5. 🎯 CASE 01のみ

- `enableAutoReveal={isFirst}` で最初のCASEのみ有効
- パフォーマンス最適化
- 視覚的ノイズを削減

---

## テスト結果

### E2Eテスト: 7/7 passed (38.8s) 🎉

```bash
Running 7 tests using 1 worker

✓ 初期表示アニメーション（自動リベール）が動作する
✓ アニメーション中にクリックすると中断される
✓ CASE 02とCASE 03にはアニメーションがない
✓ 画像の遅延読み込みとプレースホルダーが表示される
✓ フルスクリーンモードが動作する
✓ 比較モードの切替が動作する
✓ 調整パネル内の全ての新UIが表示される

7 passed (38.8s)
```

---

## UXの改善

### Before（連続往復）
```
👤 ユーザー: 「何かがずっと動いてる...？」
👤 ユーザー: 「これ、何ができるの？」
```

### After（デモ型 + ホールド）
```
👤 ユーザー: 「あ、右に動くとAfterが見える！」
        ↓ 0.3秒停止
👤 ユーザー: 「左に動くとBeforeが見える！」
        ↓ 0.3秒停止
👤 ユーザー: 「なるほど、スライダーで比較できるんだ！」
```

**結果**: 「操作方法」が直感的に理解できる

---

## 技術的詳細

### positionAt関数（キーフレーム補間）

```typescript
const positionAt = (elapsed: number) => {
  if (elapsed <= 0) return keyframes[0]!.pos
  if (elapsed >= totalDuration) return keyframes[keyframes.length - 1]!.pos

  // キーフレーム間を線形補間（イージング適用）
  for (let i = 0; i < keyframes.length - 1; i++) {
    const a = keyframes[i]!
    const b = keyframes[i + 1]!
    if (elapsed >= a.t && elapsed <= b.t) {
      if (a.pos === b.pos || b.t === a.t) return a.pos // ホールド
      const raw = (elapsed - a.t) / (b.t - a.t)
      const eased = easeInOutSine(raw)
      return a.pos + (b.pos - a.pos) * eased
    }
  }
  return 50
}
```

**ポイント**:
- `a.pos === b.pos` の場合は **ホールド**（停止）
- それ以外は **イージングを適用した補間**

### アニメーションループ

```typescript
const animate = (timestamp: number) => {
  if (!startTime) startTime = timestamp
  const elapsed = timestamp - startTime
  const pos = positionAt(elapsed)
  setSliderPosition(pos)

  if (elapsed < totalDuration) {
    animationFrameRef.current = requestAnimationFrame(animate)
  } else {
    setSliderPosition(50)
    setIsAnimating(false)
  }
}
```

---

## 変更されたファイル

### コンポーネント
- `components/before-after-slider.tsx`
  - キーフレーム方式のアニメーションに変更
  - `positionAt()` 関数で補間＋ホールド
  - `prefers-reduced-motion` 対応
  - 依存配列に `animationCancelled` を追加

### テスト
- `e2e/new-features.spec.ts`
  - 待ち時間を4.5秒に調整
  - クリック中断の検証を強化

### ドキュメント
- `ANIMATION_OPTIMIZATION.md` - 本ドキュメント（新規作成）

---

## 使い方

### 開発サーバー起動
```bash
npm run dev
# http://localhost:3000 でアクセス
```

### 確認方法
1. トップページ（`/`）を開く
2. **CASE 01のスライダーが自動的に動く**
   - 中央 → After側 → (停止) → Before側 → (停止) → 中央
3. アニメーション中にクリック → **即座に停止**
4. CASE 02, 03は静的（アニメーションなし）

### E2Eテスト実行
```bash
npm test e2e/new-features.spec.ts
```

---

## ビフォー/アフター比較

| 項目 | 変更前（連続往復） | 変更後（デモ型） |
|------|-------------------|-----------------|
| **動き** | 50% → 25% → 75% → 50% | 50% → 68%(停止) → 32%(停止) → 50% |
| **時間** | 4秒 | 4秒 |
| **停止** | なし | **2回の明確な停止** ⏸️ |
| **理解度** | ❌ 「何ができる？」 | ✅ **「スライダーで比較！」** |
| **目的達成** | ❌ 不明確 | ✅ **明確** 🎯 |

---

## ユーザーフィードバック対応の経緯

### 第1段階: 初期実装
- 2秒間の連続往復アニメーション
- フィードバック: 「早すぎる」

### 第2段階: 速度調整
- 4秒間に延長、振幅拡大
- フィードバック: 「自然にしてほしい」「クリックで止まらない」

### 第3段階: 中断機能追加
- クリック・ドラッグで中断可能に
- CASE 01のみに限定
- フィードバック: 「何ができるか分かりにくい」

### **第4段階（最終）: 目的に最適化**
- **「スライダーでBefore/Afterを比較できる」を伝える**
- **キーフレーム + ホールド** でデモンストレーション型に
- ✅ **目的達成**

---

## 今後の拡張案

### さらなる改善
- [ ] **初回訪問時のみアニメーション**: LocalStorageで訪問済みフラグ
- [ ] **スキップボタン**: アニメーション中に「スキップ」表示
- [ ] **ツールチップ**: アニメーション後に「ドラッグして比較」のヒント

### アナリティクス
- [ ] **アニメーション完了率**: どれだけのユーザーが最後まで見るか
- [ ] **中断タイミング**: どこで中断されるかを分析

---

## まとめ

✅ **「スライダーでBefore/Afterを比較できる」が瞬時に伝わる**  
✅ **停止（ホールド）を挟むことで認知しやすい**  
✅ **1回のデモで完結、繰り返しのストレスなし**  
✅ **クリック・ドラッグで即中断可能**  
✅ **アクセシビリティ対応（prefers-reduced-motion）**  
✅ **全E2Eテストが成功（7/7）**

アニメーションの目的（**ユーザーに操作方法を理解させる**）に対して、最適な実装が完成しました。

---

**実装者**: AI Assistant  
**レビュアー**: ユーザー  
**テスト環境**: Next.js 16.0.10, Playwright 1.57.0  
**参考**: [MIETELL](https://mietell.com/)の洗練されたUX + ユーザー中心設計

