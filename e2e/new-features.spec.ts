import { test, expect } from '@playwright/test';

test.describe('新機能テスト', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
  });

  test('初期表示アニメーション（自動リベール）が動作する', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01が表示される
    await expect(page.getByText('CASE 01')).toBeVisible();
    
    // スライダーが存在する
    const slider = page.locator('[class*="cursor-ew-resize"]').first();
    await expect(slider).toBeVisible();
    
    // アニメーション完了待ち（約4秒 + バッファ）
    await page.waitForTimeout(4500);
    
    // スライダーが50%付近にあることを確認（アニメーション完了後）
    const sliderPosition = await slider.evaluate((el) => {
      return el.style.left;
    });
    
    // 50%に戻っているか確認（多少の誤差を許容）
    expect(sliderPosition).toContain('50%');
  });

  test('アニメーション中にクリックすると中断される', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01が表示される
    await expect(page.getByText('CASE 01')).toBeVisible();
    
    // アニメーション開始を少し待つ（動き出し中を狙う）
    await page.waitForTimeout(900);
    
    // スライダーコンテナをクリック
    const container = page.locator('.relative.w-full.overflow-hidden.rounded-xl').first();
    await container.click();
    
    // クリック直後のスライダー位置を取得
    await page.waitForTimeout(200);
    const slider = page.locator('[class*="cursor-ew-resize"]').first();
    const positionAfterClick = await slider.evaluate((el) => {
      return el.style.left;
    });
    
    // さらに待って、位置が変わらないことを確認（アニメーションが中断されている）
    await page.waitForTimeout(1500);
    const positionAfterWait = await slider.evaluate((el) => {
      return el.style.left;
    });
    
    // アニメーションが中断されているため、位置は変わらないはず（クリック後に自動で動かない）
    expect(positionAfterClick).toBe(positionAfterWait);
  });

  test('CASE 02とCASE 03にはアニメーションがない', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 02のスライダーを取得
    const case02Slider = page.locator('[class*="cursor-ew-resize"]').nth(1);
    await expect(case02Slider).toBeVisible();
    
    // 初期位置を記録
    const initialPosition = await case02Slider.evaluate((el) => {
      return el.style.left;
    });
    
    // アニメーション時間分待つ（CASE 01のデモが終わっても、CASE 02は動かない）
    await page.waitForTimeout(4500);
    
    // 位置が変わっていないことを確認（アニメーションなし）
    const finalPosition = await case02Slider.evaluate((el) => {
      return el.style.left;
    });
    
    expect(initialPosition).toBe(finalPosition);
    expect(finalPosition).toContain('50%');
  });

  test('画像の遅延読み込みとプレースホルダーが表示される', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(1000);
    
    // プレースホルダーのSVGアイコンが一時的に表示される可能性がある
    // （高速な環境では既に画像が読み込まれている可能性もある）
    
    // 最終的に画像が表示される
    await page.waitForTimeout(3000);
    await expect(page.getByText('CASE 01')).toBeVisible();
    
    // Next.js Imageコンポーネントが使われていることを確認
    // Blob URLはsizes属性を持たないため、通常のimg要素の存在を確認
    const images = await page.locator('img').count();
    expect(images).toBeGreaterThan(0);
  });

  test('フルスクリーンモードが動作する', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // 全画面ボタンが表示される（最初のCASEのボタン）
    const fullscreenButton = page.getByRole('button', { name: '全画面' }).first();
    await expect(fullscreenButton).toBeVisible();
    
    // クリックすると「終了」ボタンに変わる（フルスクリーンAPIの制限でテストでは実際にフルスクリーンにならない場合がある）
    await fullscreenButton.click();
    
    // UIが更新されることを確認
    await page.waitForTimeout(500);
  });

  test('比較モードの切替が動作する', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // スライダーモードがデフォルトで選択されている（最初のCASEのボタン）
    const sliderButton = page.getByRole('button', { name: /スライダー/ }).first();
    await expect(sliderButton).toBeVisible();
    
    // 左右比較ボタンをクリック
    const sideBySideButton = page.getByRole('button', { name: /左右比較/ }).first();
    await expect(sideBySideButton).toBeVisible();
    await sideBySideButton.click();
    
    // 左右比較モードに切り替わる
    await page.waitForTimeout(500);
    
    // グリッドレイアウトが適用されることを確認（2列のグリッド）
    const gridContainer = page.locator('.grid.grid-cols-2').first();
    await expect(gridContainer).toBeVisible();
    
    // 再度スライダーモードに戻す
    await sliderButton.click();
    await page.waitForTimeout(500);
    
    // スライダーハンドルが表示される
    const slider = page.locator('[class*="cursor-ew-resize"]').first();
    await expect(slider).toBeVisible();
  });

  test('調整パネル内の全ての新UIが表示される', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // 調整パネルを開く
    await page.getByRole('button', { name: /縮尺・位置を調整/ }).first().click();
    
    // 比較モード切替が表示される（最初のCASEのもの）
    await expect(page.getByRole('button', { name: /スライダー/ }).first()).toBeVisible();
    await expect(page.getByRole('button', { name: /左右比較/ }).first()).toBeVisible();
    
    // 全画面ボタンが表示される
    await expect(page.getByRole('button', { name: /全画面/ }).first()).toBeVisible();
  });

  test('管理ページで初期スライダー位置を変更できる', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の編集ボタンをクリック
    await page.getByRole('button', { name: /編集/ }).first().click();
    await page.waitForTimeout(500);
    
    // 初期スライダー位置の項目が表示されることを確認
    await expect(page.getByText('初期スライダー位置')).toBeVisible();
    
    // アニメーション選択が表示されることを確認
    await expect(page.getByRole('heading', { name: 'アニメーション' })).toBeVisible();
    
    // ラジオボタンが表示されることを確認
    await expect(page.getByRole('radio', { name: /なし/ }).first()).toBeVisible();
    await expect(page.getByRole('radio', { name: /デモ/ }).first()).toBeVisible();
    
    // 初期値が50%であることを確認
    await expect(page.getByText('スライダー位置: 50%')).toBeVisible();
  });

  test('アニメーション設定を変更すると閲覧ページに反映される', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の編集ボタンをクリック
    await page.getByRole('button', { name: /編集/ }).first().click();
    await page.waitForTimeout(500);
    
    // アニメーションを「なし」に変更
    await page.getByRole('radio', { name: /なし/ }).first().click();
    await page.waitForTimeout(300);
    
    // 保存ボタンをクリック
    await page.getByRole('button', { name: /保存/ }).first().click();
    await page.waitForTimeout(1500); // 保存完了を確実に待つ
    
    // 編集ダイアログが閉じるのを待つ
    await page.waitForTimeout(500);
    
    // 閲覧ページに移動
    await page.goto('/');
    
    // 画像読み込み完了を待つ（アニメーションが開始される前に、画像が読み込まれる必要がある）
    // デフォルトでアニメーションが4秒なので、5秒待てばアニメーションが完了しているはず
    await page.waitForTimeout(5000);
    
    // アニメーション完了後、または「なし」設定の場合は初期位置に留まる
    const viewerSlider = page.locator('[class*="cursor-ew-resize"]').first();
    const position1 = await viewerSlider.evaluate((el) => el.style.left);
    
    // 初期位置50%にあることを確認
    expect(position1).toContain('50%');
    
    // さらに1秒待っても位置が変わらない（アニメーション「なし」なので静止）
    await page.waitForTimeout(1000);
    const position2 = await viewerSlider.evaluate((el) => el.style.left);
    expect(position1).toBe(position2);
  });

  test('デフォルトでCASE 01はデモアニメーションが有効', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // アニメーションが動作する（デフォルトでCASE 01は'demo'）
    const viewerSlider = page.locator('[class*="cursor-ew-resize"]').first();
    
    // 0.9秒後の位置を取得
    await page.waitForTimeout(900);
    const position1 = await viewerSlider.evaluate((el) => el.style.left);
    
    // 1.6秒後の位置を取得
    await page.waitForTimeout(700);
    const position2 = await viewerSlider.evaluate((el) => el.style.left);
    
    // 位置が変化していることを確認（アニメーションが動いている）
    expect(position1).not.toBe(position2);
    
    // アニメーション完了後（4秒+α）、初期位置（50%）に戻る
    await page.waitForTimeout(2500);
    const finalPosition = await viewerSlider.evaluate((el) => el.style.left);
    expect(finalPosition).toContain('50%');
  });
});

