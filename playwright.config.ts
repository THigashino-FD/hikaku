import { defineConfig, devices } from '@playwright/test';

const isFullE2E = !!process.env.FULL_E2E || !!process.env.CI;
const useWebServer = !!process.env.PLAYWRIGHT_WEB_SERVER;
const baseURL = useWebServer ? 'http://localhost:3100' : 'http://localhost:3000';

export default defineConfig({
  testDir: './e2e',
  fullyParallel: true, // 並列実行を有効化
  forbidOnly: !!process.env.CI,
  retries: process.env.CI ? 2 : 0,
  workers: isFullE2E ? (process.env.CI ? 2 : 4) : 2, // デフォルトは短時間のSMOKE
  reporter: 'html',
  use: {
    baseURL,
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

  // 既定では既存サーバーを使用（ユーザーの指示がない限り、自動起動はしない）
  // E2E専用ルートなど「サーバ再起動が必要」な検証を安定させたい場合だけ有効化:
  //   PLAYWRIGHT_WEB_SERVER=1 npm test
  webServer: useWebServer
    ? {
        // Error Boundary 等の挙動を安定させるため、本番サーバで実行する
        // （dev の Redbox/overlay が E2E を不安定にするため）
        // 既存の開発サーバ（3000）と衝突しないように 3100 を使用する
        command: 'E2E_ROUTES=1 npm run build && E2E_ROUTES=1 npm run start -- -p 3100',
        url: 'http://localhost:3100',
        // 既存サーバ（dev等）を再利用すると挙動が変わるため、常に新規起動する
        reuseExistingServer: false,
        timeout: 180 * 1000,
      }
    : undefined,
});
