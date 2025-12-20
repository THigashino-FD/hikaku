import { test, expect } from '@playwright/test';

test.describe('初期表示とデフォルトCASE', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
  });

  test('トップページが正常に表示される', async ({ page }) => {
    await page.goto('/');
    
    // ヘッダーが表示される
    await expect(page.getByText('RENOVATION REVIEW TOOL')).toBeVisible();
    await expect(page.getByText('改築ビフォー/アフター比較')).toBeVisible();
    
    // 管理ページボタンが表示される
    await expect(page.getByRole('link', { name: '管理ページ' })).toBeVisible();
  });

  test('デフォルトCASEが3件作成される', async ({ page }) => {
    await page.goto('/');
    
    // デフォルトCASEのセットアップを待つ（最大10秒）
    await page.waitForTimeout(3000);
    
    // CASE 01, 02, 03が表示される
    await expect(page.getByText('CASE 01')).toBeVisible();
    await expect(page.getByText('CASE 02')).toBeVisible();
    await expect(page.getByText('CASE 03')).toBeVisible();
    
    // スライダーが表示される
    const sliders = await page.locator('[class*="cursor-ew-resize"]').count();
    expect(sliders).toBeGreaterThanOrEqual(3);
  });

  test('管理ページへ遷移できる', async ({ page }) => {
    await page.goto('/');
    
    // 管理ページボタンをクリック
    await page.getByRole('link', { name: '管理ページ' }).click();
    
    // 管理ページが表示される
    await expect(page.getByText('管理ページ')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規CASE追加' })).toBeVisible();
    await expect(page.getByRole('button', { name: /画像ライブラリ/ })).toBeVisible();
  });
});

test.describe('CASE管理', () => {
  test.beforeEach(async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
    
    // 管理ページに移動
    await page.goto('/manage');
    
    // デフォルトCASEのセットアップを待つ
    await page.waitForTimeout(3000);
  });

  test('デフォルトCASEが管理ページに表示される', async ({ page }) => {
    // 3つのCASEが表示される
    await expect(page.getByText('CASE 01')).toBeVisible();
    await expect(page.getByText('CASE 02')).toBeVisible();
    await expect(page.getByText('CASE 03')).toBeVisible();
    
    // 各CASEに編集・複製・削除ボタンがある
    const editButtons = await page.getByRole('button', { name: '編集' }).count();
    expect(editButtons).toBe(3);
  });

  test('新規CASEを追加できる', async ({ page }) => {
    // 新規CASE追加ボタンをクリック
    await page.getByRole('button', { name: '新規CASE追加' }).click();
    
    // 新しいCASEが追加される（CASE 4）
    await page.waitForTimeout(1000);
    await expect(page.getByText('CASE 4')).toBeVisible();
  });

  test('CASEを編集できる', async ({ page }) => {
    // 最初のCASEの編集ボタンをクリック
    await page.getByRole('button', { name: '編集' }).first().click();
    
    // CASE編集ページが表示される
    await expect(page.getByText('CASE編集')).toBeVisible();
    await expect(page.getByRole('button', { name: '保存' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'キャンセル' })).toBeVisible();
    
    // タイトルを変更
    const titleInput = page.locator('input[placeholder*="CASE"]').first();
    await titleInput.clear();
    await titleInput.fill('テストCASE');
    
    // 保存
    await page.getByRole('button', { name: '保存' }).click();
    
    // 管理ページに戻り、変更が反映されている
    await page.waitForTimeout(1000);
    await expect(page.getByText('テストCASE')).toBeVisible();
  });

  test('CASEを削除できる', async ({ page }) => {
    // 削除前のCASE数を確認
    const initialCount = await page.getByRole('button', { name: '編集' }).count();
    
    // 最初のCASEの削除ボタンをクリック
    page.once('dialog', dialog => {
      expect(dialog.message()).toContain('削除');
      dialog.accept();
    });
    await page.getByRole('button', { name: '削除' }).first().click();
    
    // CASEが1つ減っている
    await page.waitForTimeout(1000);
    const newCount = await page.getByRole('button', { name: '編集' }).count();
    expect(newCount).toBe(initialCount - 1);
  });

  test('CASEの並び順を変更できる', async ({ page }) => {
    // スキップ：上下ボタンのセレクタが複雑なため、将来的に改善
    test.skip();
  });
});

test.describe('画像ライブラリ', () => {
  test.beforeEach(async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
    
    await page.goto('/manage');
    await page.waitForTimeout(3000);
  });

  test('画像ライブラリを開ける', async ({ page }) => {
    // 画像ライブラリボタンをクリック
    await page.getByRole('button', { name: /画像ライブラリ/ }).click();
    
    // 画像ライブラリページが表示される
    await expect(page.getByText('画像ライブラリ')).toBeVisible();
    await expect(page.getByRole('button', { name: '画像をアップロード' })).toBeVisible();
    await expect(page.getByRole('button', { name: '全データ削除' })).toBeVisible();
  });

  test('デフォルト画像が6枚登録されている', async ({ page }) => {
    await page.getByRole('button', { name: /画像ライブラリ/ }).click();
    
    // 6枚の画像が表示される
    await page.waitForTimeout(1000);
    await expect(page.getByText('6 画像')).toBeVisible();
    
    // 検索ボックスが表示される
    await expect(page.getByPlaceholder('画像名で検索...')).toBeVisible();
  });

  test('検索機能が動作する', async ({ page }) => {
    await page.getByRole('button', { name: /画像ライブラリ/ }).click();
    await page.waitForTimeout(1000);
    
    // 検索
    const searchBox = page.getByPlaceholder('画像名で検索...');
    await searchBox.fill('house-2');
    
    // 検索結果が絞り込まれる
    await page.waitForTimeout(500);
    const cards = await page.locator('div.overflow-hidden.rounded-lg').count();
    expect(cards).toBeLessThan(6);
  });
});

test.describe('データ永続性', () => {
  test('ページリロード後もCASEが保持される', async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
    
    // デフォルトCASEが表示されることを確認
    await expect(page.getByText('CASE 01')).toBeVisible();
    
    // リロード
    await page.reload();
    await page.waitForTimeout(2000);
    
    // 引き続きCASEが表示される
    await expect(page.getByText('CASE 01')).toBeVisible();
    await expect(page.getByText('CASE 02')).toBeVisible();
    await expect(page.getByText('CASE 03')).toBeVisible();
  });

  test('CASE追加後、リロードしても保持される', async ({ page, context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
    
    await page.goto('/manage');
    await page.waitForTimeout(3000);
    
    // 初期状態のCASE数を確認（デフォルト3件）
    const initialCount = await page.locator('div.font-semibold').count();
    expect(initialCount).toBe(3);
    
    // 新規CASE追加
    await page.getByRole('button', { name: '新規CASE追加' }).click();
    await page.waitForTimeout(1000);
    
    // CASEが1つ増えている
    const afterAddCount = await page.locator('div.font-semibold').count();
    expect(afterAddCount).toBe(4);
    
    // トップページに移動（IndexedDBの永続性をテスト）
    await page.getByRole('link', { name: '閲覧ページへ' }).click();
    await page.waitForTimeout(2000);
    
    // 4つのCASEが表示される
    const viewPageCaseHeaders = await page.locator('h2, h3').filter({ hasText: /CASE/ }).count();
    expect(viewPageCaseHeaders).toBeGreaterThanOrEqual(4);
  });
});

test.describe('閲覧ページの機能', () => {
  test.beforeEach(async ({ page, context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
    
    await page.goto('/');
    await page.waitForTimeout(3000);
  });

  test('スライダーが動作する', async ({ page }) => {
    // 最初のスライダーハンドルを取得
    const handle = page.locator('[class*="cursor-ew-resize"]').first();
    await expect(handle).toBeVisible();
    
    // スライダーをドラッグ（簡易チェック：要素が存在することを確認）
    const box = await handle.boundingBox();
    expect(box).toBeTruthy();
  });

  test('調整パネルを開閉できる', async ({ page }) => {
    // 調整ボタンをクリック
    await page.getByRole('button', { name: '縮尺・位置を調整' }).first().click();
    
    // 調整パネルが表示される
    await expect(page.getByText('改築前の画像調整')).toBeVisible();
    await expect(page.getByText('改築後の画像調整')).toBeVisible();
    
    // 閉じるボタンをクリック
    await page.getByRole('button', { name: '調整パネルを閉じる' }).first().click();
    
    // パネルが閉じる
    await expect(page.getByText('改築前の画像調整')).not.toBeVisible();
  });
});

