import { test, expect, Page } from '@playwright/test';

async function expectNoHorizontalScroll(page: Page) {
  const result = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return {
      docClientWidth: doc.clientWidth,
      docScrollWidth: doc.scrollWidth,
      bodyClientWidth: body?.clientWidth ?? 0,
      bodyScrollWidth: body?.scrollWidth ?? 0,
    };
  });

  // 1pxの誤差（サブピクセル/スクロールバー）を許容
  expect(result.docScrollWidth).toBeLessThanOrEqual(result.docClientWidth + 1);
  expect(result.bodyScrollWidth).toBeLessThanOrEqual(result.bodyClientWidth + 1);
}

test.describe('レスポンシブ（基本崩れチェック）', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
  });

  test('トップページ：主要要素が表示され、横スクロールが発生しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    await expect(page.getByRole('link', { name: '管理ページ' })).toBeVisible();
    await expect(page.getByText('劇的ビフォー/アフターツール')).toBeVisible();

    // CASEが表示されていること（最低1つ）
    await expect(page.getByText('CASE 01')).toBeVisible();

    await expectNoHorizontalScroll(page);
  });

  test('トップページ：調整パネルを開いても横スクロールが発生しない', async ({ page }) => {
    await page.goto('/');
    await page.waitForTimeout(3000);

    // 調整パネルを開く（最初のCASE）
    await page.getByRole('button', { name: /^調整$/ }).first().click();
    await expect(page.getByText('改築前の画像調整')).toBeVisible();

    await expectNoHorizontalScroll(page);
  });

  test('管理ページ：主要要素が表示され、横スクロールが発生しない', async ({ page }) => {
    await page.goto('/manage');
    await page.waitForTimeout(3000);

    await expect(page.getByText('管理ページ')).toBeVisible();
    await expect(page.getByRole('button', { name: '新規CASE追加' })).toBeVisible();
    await expect(page.getByRole('button', { name: /画像ライブラリ/ })).toBeVisible();

    await expectNoHorizontalScroll(page);
  });

  test('画像ピッカーのモーダル：表示でき、縦スクロール領域が確保される', async ({ page }) => {
    await page.goto('/manage');
    await page.waitForTimeout(3000);

    // CASE編集へ
    const caseSection = page.locator('section').filter({ hasText: 'CASE一覧' });
    await caseSection.getByRole('button', { name: '編集' }).first().click();
    await page.waitForTimeout(1200);
    await expect(page.getByText('CASE編集')).toBeVisible();

    // ImagePicker を開く（「画像を選択」ボタンのどれか）
    await page.getByRole('button', { name: '画像を選択' }).first().click();

    // モーダル内の検索入力が見えること
    await expect(page.getByPlaceholder('画像名で検索...')).toBeVisible();

    // モーダルは縦方向にスクロール可能（max-h + overflow-y-auto）であることを確認
    const gridScroll = page.locator('.max-h-\\[50vh\\].overflow-y-auto').first();
    await expect(gridScroll).toBeVisible();

    await expectNoHorizontalScroll(page);
  });
});


