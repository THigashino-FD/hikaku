import { test, expect } from '@playwright/test';

/**
 * 境界ケースと失敗シナリオのテスト
 * 外部境界（画像取得・共有リンク・OG生成）の堅牢性を確認
 */

test.describe('共有リンクの境界ケース', () => {
  test('破損した共有リンクでエラーメッセージが表示される', async ({ page }) => {
    // 不正なBase64文字列
    await page.goto('/#share=invalid!!!base64');
    
    // エラーメッセージが表示される
    await expect(page.getByText(/共有データの復号|共有リンクの解析/)).toBeVisible({ timeout: 5000 });
    await expect(page.getByRole('button', { name: /閉じる/ })).toBeVisible();
  });

  test('空の共有リンクは無視される', async ({ page }) => {
    await page.goto('/#share=');
    
    // 通常のページが表示される（エラーにならない）
    await expect(page.getByText('劇的ビフォー/アフターツール')).toBeVisible({ timeout: 10000 });
  });

  test('JSONが不正な共有リンクでエラーメッセージが表示される', async ({ page }) => {
    // 正しいBase64だがJSONとして不正
    const invalidBase64 = btoa('{ invalid json');
    await page.goto(`/#share=${invalidBase64}`);
    
    // エラーメッセージが表示される
    await expect(page.getByText(/共有データの復号|共有リンクの解析/)).toBeVisible({ timeout: 5000 });
  });

  test('必須フィールドが欠けた共有データでエラーメッセージが表示される', async ({ page }) => {
    // beforeUrlが欠けているデータ
    const invalidData = {
      title: 'Test',
      afterUrl: 'https://example.com/after.jpg',
    };
    const encoded = btoa(JSON.stringify(invalidData));
    const urlSafeEncoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    await page.goto(`/#share=${urlSafeEncoded}`);
    
    // エラーメッセージが表示される
    await expect(page.getByText(/画像URL|見つかりません/)).toBeVisible({ timeout: 5000 });
  });

  test('HTTPの画像URLでエラーメッセージが表示される', async ({ page }) => {
    // HTTPSではなくHTTPのURL
    const invalidData = {
      title: 'Test',
      beforeUrl: 'http://example.com/before.jpg',  // HTTP（不許可）
      afterUrl: 'https://example.com/after.jpg',
      initialSliderPosition: 50,
      animationType: 'none',
      view: {
        before: { scale: 1, x: 0, y: 0 },
        after: { scale: 1, x: 0, y: 0 },
      },
    };
    const encoded = btoa(JSON.stringify(invalidData));
    const urlSafeEncoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    await page.goto(`/#share=${urlSafeEncoded}`);
    
    // エラーメッセージが表示される
    await expect(page.getByText(/HTTPS|許可/)).toBeVisible({ timeout: 5000 });
  });

  test('古いバージョンの共有データも正常に読み込める', async ({ page }) => {
    // バージョンフィールドがない（旧形式）データ
    const oldData = {
      title: 'Legacy Data',
      beforeUrl: 'https://example.com/before.jpg',
      afterUrl: 'https://example.com/after.jpg',
      initialSliderPosition: 50,
      animationType: 'none',
      view: {
        before: { scale: 1, x: 0, y: 0 },
        after: { scale: 1, x: 0, y: 0 },
      },
    };
    const encoded = btoa(JSON.stringify(oldData));
    const urlSafeEncoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    await page.goto(`/#share=${urlSafeEncoded}`);
    
    // 共有プレビューが表示される（エラーにならない）
    await expect(page.getByRole('heading', { name: '共有プレビュー' })).toBeVisible({ timeout: 5000 });
  });
});

test.describe('OG画像生成の境界ケース', () => {
  test('デフォルトOG画像が生成される', async ({ page }) => {
    const response = await page.goto('/api/og');
    
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/');
  });

  test('破損した共有データでもフォールバックOG画像が生成される', async ({ page }) => {
    const response = await page.goto('/api/og?share=invalid!!!base64');
    
    // エラーではなく200（フォールバック画像を返す）
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/');
  });

  test('正常な共有データでカスタムOG画像が生成される', async ({ page }) => {
    const validData = {
      version: 1,
      title: 'Test Case',
      description: 'Test Description',
      beforeUrl: 'https://example.com/before.jpg',
      afterUrl: 'https://example.com/after.jpg',
      initialSliderPosition: 50,
      animationType: 'none',
      view: {
        before: { scale: 1, x: 0, y: 0 },
        after: { scale: 1, x: 0, y: 0 },
      },
    };
    const encoded = btoa(JSON.stringify(validData));
    const urlSafeEncoded = encoded.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
    
    const response = await page.goto(`/api/og?share=${urlSafeEncoded}`);
    
    expect(response?.status()).toBe(200);
    expect(response?.headers()['content-type']).toContain('image/');
  });
});

test.describe('画像取得APIの境界ケース', () => {
  test('URLが必須', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {},
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('無効なURL形式でエラー', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'not-a-url' },
    });
    
    expect(response.status()).toBe(400);
    const body = await response.json();
    expect(body.success).toBe(false);
  });

  test('HTTPのURLは拒否される', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'http://example.com/image.jpg' },
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_URL');
  });

  test('プライベートIPは拒否される', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'https://192.168.1.1/image.jpg' },
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_URL');
  });

  test('localhostは拒否される', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'https://localhost/image.jpg' },
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_URL');
  });

  test('パブリックなHTTPSドメイン名の画像URLは許可される', async ({ request }) => {
    // 一般的なWebサイトの画像URLを許可（パブリックなドメイン名）
    const response = await request.post('/api/fetch-image', {
      data: { url: 'https://example.com/image.jpg' },
    });
    
    // 実際の画像取得は失敗する可能性があるが、URL検証は通る
    // （404エラーなどは別のエラーとして処理される）
    expect([200, 404, 502]).toContain(response.status());
  });

  test('内部ドメイン（.local）は拒否される', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'https://internal.local/image.jpg' },
    });
    
    expect(response.status()).toBe(403);
    const body = await response.json();
    expect(body.success).toBe(false);
    expect(body.error.code).toBe('FORBIDDEN_URL');
  });
});

test.describe('エラーレスポンスの一貫性', () => {
  test('全てのエラーレスポンスに必須フィールドが含まれる', async ({ request }) => {
    // バリデーションエラー
    const response1 = await request.post('/api/fetch-image', {
      data: {},
    });
    const body1 = await response1.json();
    expect(body1).toHaveProperty('success');
    expect(body1).toHaveProperty('error');
    expect(body1.error).toHaveProperty('code');
    expect(body1.error).toHaveProperty('message');
    expect(body1.error).toHaveProperty('statusCode');
    
    // 禁止URLエラー
    const response2 = await request.post('/api/fetch-image', {
      data: { url: 'http://example.com/image.jpg' },
    });
    const body2 = await response2.json();
    expect(body2).toHaveProperty('success');
    expect(body2).toHaveProperty('error');
    expect(body2.error).toHaveProperty('code');
    expect(body2.error).toHaveProperty('message');
    expect(body2.error).toHaveProperty('statusCode');
  });
});

test.describe('リトライ可能エラーの識別', () => {
  test('バリデーションエラーはリトライ不可', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'not-a-url' },
    });
    
    const body = await response.json();
    // バリデーションエラーはリトライしても意味がない
    expect(body.error.code).toBe('VALIDATION_ERROR');
  });

  test('禁止URLエラーはリトライ不可', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: { url: 'http://example.com/image.jpg' },
    });
    
    const body = await response.json();
    // 禁止URLはリトライしても成功しない
    expect(body.error.code).toBe('FORBIDDEN_URL');
  });
});

