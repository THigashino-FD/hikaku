import { defineConfig, devices } from '@playwright/test';

const isFullE2E = !!process.env.FULL_E2E || !!process.env.CI;

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // 並列実行を有効化
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: isFullE2E ? (process.env.CI ? 2 : 4) : 2, // デフォルトは短時間のSMOKE
  reporter: 'html',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
    screenshot: 'only-on-failure',
  },

  // デフォルトはchromiumのみ（短時間で回帰検知）
  // FULL_E2E=1 を付けた場合のみ、デバイス/ブラウザマトリクスを実行
  projects: isFullE2E
    ? [
        { name: 'chromium', use: { ...devices['Desktop Chrome'] } },
        { name: 'mobile-chrome', use: { ...devices['Pixel 5'] } },
        { name: 'mobile-safari', use: { ...devices['iPhone 13'] } },
        { name: 'tablet', use: { ...devices['iPad (gen 7)'] } },
      ]
    : [{ name: 'chromium', use: { ...devices['Desktop Chrome'] } }],

  // webServerを無効化して既存サーバーを使用
  // webServer: {
  //   command: 'npm run dev',
  //   url: 'http://localhost:3000',
  //   reuseExistingServer: true,
  //   timeout: 120 * 1000,
  // },
});
