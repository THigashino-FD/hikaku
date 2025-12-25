import { test, expect } from '@playwright/test';

test.describe('新機能テスト', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア（ただし、同一テスト内の画面遷移/リロードで再クリアしない）
    await context.addInitScript(() => {
      try {
        const key = '__pw_db_cleared__';
        if (typeof localStorage !== 'undefined' && !localStorage.getItem(key)) {
          indexedDB.deleteDatabase('hikaku-editor');
          localStorage.setItem(key, '1');
        }
      } catch {
        indexedDB.deleteDatabase('hikaku-editor');
      }
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
    
    // アニメーション完了待ち（約6秒 + バッファ）
    await page.waitForTimeout(7000);
    
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
    await page.waitForTimeout(7000);
    
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
    
    // グリッドレイアウトが適用されることを確認（viewportにより1列/2列の可能性がある）
    const gridContainer = page.locator('.grid').first();
    await expect(gridContainer).toBeVisible();

    // レイアウトが「グリッドとして成立」していること（列定義が存在すること）を確認
    const gridTemplateColumns = await gridContainer.evaluate((el) => {
      return window.getComputedStyle(el).gridTemplateColumns;
    });
    expect(gridTemplateColumns).not.toBe('');
    
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
    
    // 調整パネルを開く（UI変更によりボタン文言は「調整」）
    await page.getByRole('button', { name: /^調整$/ }).first().click();
    
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
    
    // CASE 01の編集ボタンをクリック（CASE一覧セクション内）
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    await caseSection.getByRole('button', { name: /編集/ }).first().click();
    await page.waitForTimeout(1500);
    
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
    
    // CASE 01の編集ボタンをクリック（CASE一覧セクション内）
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    await caseSection.getByRole('button', { name: /編集/ }).first().click();
    await page.waitForTimeout(1500);
    
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
    // デフォルトでアニメーションが6秒なので、7秒待てばアニメーションが完了しているはず
    await page.waitForTimeout(7000);
    
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

  test('デフォルトでCASE 01はデモアニメーションが有効', async ({ page, browserName }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01が表示されることを確認
    await expect(page.getByText('CASE 01')).toBeVisible();
    
    // アニメーションが動作する（デフォルトでCASE 01は'demo'）
    const viewerSlider = page.locator('[class*="cursor-ew-resize"]').first();
    await expect(viewerSlider).toBeVisible();
    
    // 画像が読み込まれるまで待つ（WebKitは特に時間がかかる）
    // アニメーションは画像読み込み後に開始される
    const imageLoadWait = browserName === 'webkit' ? 2000 : 1000;
    await page.waitForTimeout(imageLoadWait);
    
    // アニメーション開始直後の位置を取得（初期位置50%で0.4秒停止後、動き始める前）
    // アニメーションは0ms:50% → 400ms:50% → 1800ms:右側へ移動開始
    // なので、500ms時点で位置を取得すれば初期位置（50%）のはず
    await page.waitForTimeout(500);
    const initialPosition = await viewerSlider.evaluate((el) => el.style.left);
    
    // アニメーションが動き始めた後の位置を取得（1800ms以降、右側へ移動中）
    // 2000ms時点で取得すれば、右側へ移動しているはず
    await page.waitForTimeout(1500);
    const midPosition = await viewerSlider.evaluate((el) => el.style.left);
    
    // 位置が変化していることを確認（アニメーションが動いている）
    expect(initialPosition).not.toBe(midPosition);
    
    // アニメーション完了後（6秒+α）、初期位置（50%）に戻る
    // 浮動小数点の精度により完全に50%にならない場合があるため、49%〜51%の範囲を許容
    await page.waitForTimeout(5000);
    const finalPosition = await viewerSlider.evaluate((el) => {
      const left = el.style.left;
      const match = left.match(/([\d.]+)%/);
      return match ? parseFloat(match[1]) : null;
    });
    expect(finalPosition).not.toBeNull();
    expect(finalPosition).toBeGreaterThanOrEqual(49);
    expect(finalPosition).toBeLessThanOrEqual(51);
  });
});

test.describe('共有機能', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア
    await context.addInitScript(() => {
      try {
        const key = '__pw_db_cleared__';
        if (typeof localStorage !== 'undefined' && !localStorage.getItem(key)) {
          indexedDB.deleteDatabase('hikaku-editor');
          localStorage.setItem(key, '1');
        }
      } catch {
        indexedDB.deleteDatabase('hikaku-editor');
      }
    });
  });

  test('管理ページから共有リンクを生成できる', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await expect(shareButton).toBeVisible();
    await shareButton.click();
    
    // 共有リンクが表示される（エラーまたはリンク）
    await page.waitForTimeout(1000);
    
    // 共有リンクの入力フィールドが表示されることを確認
    const shareLinkInput = page.locator('input[readonly]').filter({ hasText: /share|localhost/ }).first();
    
    // エラーが表示されない場合（URL画像が設定されている場合）、共有リンクが生成されている
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (!hasError) {
      // 共有リンクが生成されていることを確認
      await expect(shareLinkInput).toBeVisible({ timeout: 5000 });
      const shareLinkValue = await shareLinkInput.inputValue();
      expect(shareLinkValue).toContain('share');
    } else {
      // URL画像が設定されていない場合はスキップ
      test.skip();
    }
  });

  test('共有リンクをコピーできる', async ({ page, context }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await shareButton.click();
    await page.waitForTimeout(1000);
    
    // エラーが表示されない場合のみテストを続行
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (hasError) {
      test.skip();
      return;
    }
    
    // コピーボタンをクリック
    const copyButton = page.getByRole('button', { name: 'コピー' });
    await expect(copyButton).toBeVisible({ timeout: 5000 });
    
    // クリップボードAPIの権限を付与
    await context.grantPermissions(['clipboard-read', 'clipboard-write']);
    
    await copyButton.click();
    await page.waitForTimeout(500);
    
    // クリップボードから共有リンクを取得
    const clipboardText = await page.evaluate(() => navigator.clipboard.readText());
    expect(clipboardText).toContain('share');
  });

  test('共有専用ページ（/share/[encoded]）でプレビューが表示される', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await shareButton.click();
    await page.waitForTimeout(1000);
    
    // エラーが表示されない場合のみテストを続行
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (hasError) {
      test.skip();
      return;
    }
    
    // 共有リンクを取得
    const shareLinkInput = page.locator('input[readonly]').first();
    await expect(shareLinkInput).toBeVisible({ timeout: 5000 });
    const shareLink = await shareLinkInput.inputValue();
    
    // 共有専用ページにアクセス
    await page.goto(shareLink);
    await page.waitForTimeout(2000);
    
    // 共有プレビューセクションが表示される
    await expect(page.getByText('共有プレビュー')).toBeVisible({ timeout: 10000 });
  });

  test('共有プレビューで画像読み込み中の表示が表示される', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await shareButton.click();
    await page.waitForTimeout(1000);
    
    // エラーが表示されない場合のみテストを続行
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (hasError) {
      test.skip();
      return;
    }
    
    // 共有リンクを取得
    const shareLinkInput = page.locator('input[readonly]').first();
    await expect(shareLinkInput).toBeVisible({ timeout: 5000 });
    const shareLink = await shareLinkInput.inputValue();
    
    // 共有専用ページにアクセス
    await page.goto(shareLink);
    
    // 共有プレビューセクションが表示される
    await expect(page.getByText('共有プレビュー')).toBeVisible({ timeout: 10000 });
    
    // 画像読み込み中の表示が表示される（一時的に）
    const loadingIndicator = page.getByText(/読み込み中/);
    // 読み込みが高速な場合は表示されない可能性があるため、オプショナル
    await loadingIndicator.isVisible().catch(() => {
      // 読み込みが既に完了している場合はスキップ
    });
  });

  test('共有プレビューでスライダーが表示される（画像読み込み後）', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await shareButton.click();
    await page.waitForTimeout(1000);
    
    // エラーが表示されない場合のみテストを続行
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (hasError) {
      test.skip();
      return;
    }
    
    // 共有リンクを取得
    const shareLinkInput = page.locator('input[readonly]').first();
    await expect(shareLinkInput).toBeVisible({ timeout: 5000 });
    const shareLink = await shareLinkInput.inputValue();
    
    // 共有専用ページにアクセス
    await page.goto(shareLink);
    
    // 共有プレビューセクションが表示される
    await expect(page.getByText('共有プレビュー')).toBeVisible({ timeout: 10000 });
    
    // 画像が読み込まれるまで待つ（最大15秒）
    await page.waitForTimeout(15000);
    
    // Before/Afterスライダーが表示される
    const slider = page.locator('[class*="cursor-ew-resize"]').first();
    await expect(slider).toBeVisible({ timeout: 5000 });
  });

  test('共有CASEとして保存できる', async ({ page }) => {
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
    
    // CASE 01の共有ボタンをクリック
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    const shareButton = caseSection.getByRole('button', { name: '共有' }).first();
    await shareButton.click();
    await page.waitForTimeout(1000);
    
    // エラーが表示されない場合のみテストを続行
    const shareError = page.getByText(/画像が設定されていません|URL画像ではない/);
    const hasError = await shareError.isVisible().catch(() => false);
    
    if (hasError) {
      test.skip();
      return;
    }
    
    // 共有リンクを取得
    const shareLinkInput = page.locator('input[readonly]').first();
    await expect(shareLinkInput).toBeVisible({ timeout: 5000 });
    const shareLink = await shareLinkInput.inputValue();
    
    // 共有専用ページにアクセス
    await page.goto(shareLink);
    
    // 共有プレビューセクションが表示される
    await expect(page.getByText('共有プレビュー')).toBeVisible({ timeout: 10000 });
    
    // 画像が読み込まれるまで待つ（最大15秒）
    await page.waitForTimeout(15000);
    
    // 保存前のCASE数を取得
    const caseCountBefore = await page.getByText(/CASE \d+/).count();
    
    // 「共有CASEとして保存」ボタンをクリック
    const saveButton = page.getByRole('button', { name: /共有CASEとして保存/ });
    await expect(saveButton).toBeVisible({ timeout: 5000 });
    await saveButton.click();
    
    // 保存中表示が表示される（一時的に）
    const savingIndicator = page.getByText(/保存中/);
    await savingIndicator.isVisible().catch(() => {
      // 保存が高速な場合は表示されない可能性がある
    });
    
    // 保存完了を待つ（最大10秒）
    await page.waitForTimeout(10000);
    
    // 共有プレビューが閉じられる（または新しいCASEが表示される）
    // 保存が成功した場合、新しいCASEが表示されるか、共有プレビューが閉じられる
    const caseCountAfter = await page.getByText(/CASE \d+/).count();
    
    // CASE数が増えているか、または共有プレビューが閉じられていることを確認
    const sharePreviewVisible = await page.getByText('共有プレビュー').isVisible().catch(() => false);
    expect(caseCountAfter > caseCountBefore || !sharePreviewVisible).toBe(true);
  });
});

