import { test, expect } from '@playwright/test';

test.describe('API Routes - fetch-image', () => {
  test('無効なURLでエラーレスポンスを返す', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'not-a-valid-url'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toBeTruthy();
    expect(data.error).toContain('無効なURL形式');
  });

  test('HTTP（非HTTPS）プロトコルを拒否する', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'http://example.com/image.jpg'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('HTTPS');
  });

  test('プライベートIPアドレスを拒否する（localhost）', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://localhost/image.jpg'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('プライベートIP');
  });

  test('プライベートIPアドレスを拒否する（10.x.x.x）', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://10.0.0.1/image.jpg'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('プライベートIP');
  });

  test('プライベートIPアドレスを拒否する（192.168.x.x）', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://192.168.1.1/image.jpg'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('プライベートIP');
  });

  test('許可されていないホスト名を拒否する', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://evil.com/image.jpg'
      }
    });

    expect(response.status()).toBe(403);
    const data = await response.json();
    expect(data.error).toContain('許可されていないホスト');
  });

  test('URLパラメータが欠けている場合のエラー', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {}
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('URL');
  });

  test('URLパラメータが文字列でない場合のエラー', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 12345
      }
    });

    expect(response.status()).toBe(400);
    const data = await response.json();
    expect(data.error).toContain('URL');
  });

  test('許可されたホスト名（Google Drive）は受け入れる', async ({ request }) => {
    // 注意: 実際の画像取得は失敗する可能性があるが、URL検証は通過する
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://drive.google.com/uc?id=test123'
      }
    });

    // URL検証は通過するが、実際の画像取得で失敗する可能性がある
    // ステータスコードが403（許可されていない）でないことを確認
    expect(response.status()).not.toBe(403);
  });

  test('許可されたホスト名（lh3.googleusercontent.com）は受け入れる', async ({ request }) => {
    const response = await request.post('/api/fetch-image', {
      data: {
        url: 'https://lh3.googleusercontent.com/test.jpg'
      }
    });

    // URL検証は通過する
    expect(response.status()).not.toBe(403);
  });
});

test.describe('API Routes - OG画像生成', () => {
  test('デフォルトのOG画像を生成できる', async ({ request }) => {
    const response = await request.get('/api/og');

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('共有データ付きのOG画像を生成できる', async ({ request }) => {
    // 簡単な共有データをエンコード（実際のエンコード形式に合わせる）
    const shareData = Buffer.from(JSON.stringify({
      title: 'テストCASE',
      description: 'テスト説明',
      beforeUrl: 'https://example.com/before.jpg',
      afterUrl: 'https://example.com/after.jpg',
      view: {
        before: { scale: 100, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 }
      },
      initialSliderPosition: 50,
      animationType: 'none'
    })).toString('base64');

    const response = await request.get(`/api/og?share=${encodeURIComponent(shareData)}`);

    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });

  test('無効な共有データでもフォールバック画像を返す', async ({ request }) => {
    const response = await request.get('/api/og?share=invalid-data');

    // エラーでも画像を返す（フォールバック）
    expect(response.status()).toBe(200);
    expect(response.headers()['content-type']).toContain('image/png');
  });
});

