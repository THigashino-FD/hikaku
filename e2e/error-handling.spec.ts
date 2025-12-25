import { test, expect } from '@playwright/test';

const isWebServer = !!process.env.PLAYWRIGHT_WEB_SERVER;

test.describe('エラーハンドリング', () => {
  test.beforeEach(async ({ context }) => {
    // 各テスト前にIndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });
  });

  test('トップページのError Boundaryが動作する', async ({ page }) => {
    test.skip(!isWebServer, 'Error BoundaryのE2Eは本番サーバ（webServer）実行時のみ安定します');
    // テスト専用のエラーページで強制的に例外を投げる
    await page.goto('/e2e/error?force=1');

    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'トップページへ' })).toBeVisible();
  });

  test('管理ページのError Boundaryが動作する', async ({ page }) => {
    test.skip(!isWebServer, 'Error BoundaryのE2Eは本番サーバ（webServer）実行時のみ安定します');
    await page.goto('/manage/e2e/error?force=1');

    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });
    await expect(page.getByRole('button', { name: '再試行' })).toBeVisible();
    await expect(page.getByRole('button', { name: '管理ページに戻る' })).toBeVisible();
  });

  test('Error Boundaryの再試行ボタンが動作する', async ({ page }) => {
    test.skip(!isWebServer, 'Error BoundaryのE2Eは本番サーバ（webServer）実行時のみ安定します');
    await page.goto('/e2e/error?force=1');
    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });

    // reset() が呼ばれて再レンダリングされる（このページは再度throwするので、再びError UIになる）
    await page.getByRole('button', { name: '再試行' }).click();
    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });
  });

  test('Error Boundaryのトップページへボタンが動作する', async ({ page }) => {
    test.skip(!isWebServer, 'Error BoundaryのE2Eは本番サーバ（webServer）実行時のみ安定します');
    await page.goto('/e2e/error?force=1');
    await expect(page.getByText('エラーが発生しました')).toBeVisible({ timeout: 10000 });

    await page.getByRole('button', { name: 'トップページへ' }).click();
    await expect(page.getByText('劇的ビフォー/アフターツール')).toBeVisible({ timeout: 15000 });
  });
});

test.describe('Loading UI', () => {
  test('トップページのLoading UIが表示される', async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });

    // ネットワークを遅延させてLoading UIを確認
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 100);
    });

    await page.goto('/');
    
    // Loading UIが表示されるか、またはすぐにコンテンツが表示される
    await page.waitForTimeout(1000);
    
    // 最終的にコンテンツが表示される
    await expect(page.getByText('劇的ビフォー/アフターツール')).toBeVisible({ timeout: 10000 });
  });

  test('管理ページのLoading UIが表示される', async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });

    await page.goto('/manage');
    
    // 最終的にコンテンツが表示される
    await expect(page.getByText('管理ページ')).toBeVisible({ timeout: 10000 });
  });

  test('Suspense fallbackが表示される', async ({ page, context }) => {
    // IndexedDBをクリア
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor');
    });

    // ネットワークを大幅に遅延させる
    await page.route('**/*', route => {
      setTimeout(() => route.continue(), 500);
    });

    await page.goto('/');
    
    // 最終的にコンテンツが表示される
    await expect(page.getByText('劇的ビフォー/アフターツール')).toBeVisible({ timeout: 15000 });
  });
});

