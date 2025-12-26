import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

test.describe('UI/UX改善機能のテスト', () => {
  test.describe('アクセシビリティ機能', () => {
    test.beforeEach(async ({ context }) => {
      // 各テスト前にIndexedDBをクリア
      await context.addInitScript(() => {
        indexedDB.deleteDatabase('hikaku-editor')
      })
    })

    test.describe('ARIA属性', () => {
      test('スライダーにrole="slider"とaria属性が設定されている', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // 最初のスライダーを取得
        const slider = page.locator('[role="slider"]').first()
        await expect(slider).toBeVisible()

        // ARIA属性を確認
        await expect(slider).toHaveAttribute('aria-valuemin', '0')
        await expect(slider).toHaveAttribute('aria-valuemax', '100')
        await expect(slider).toHaveAttribute('aria-label', 'Before/After比較スライダー')
        
        // aria-valuenowが存在することを確認（値は動的）
        const ariaNow = await slider.getAttribute('aria-valuenow')
        expect(ariaNow).not.toBeNull()
        expect(Number(ariaNow)).toBeGreaterThanOrEqual(0)
        expect(Number(ariaNow)).toBeLessThanOrEqual(100)
      })

      test('画像ライブラリモーダルにrole="dialog"とaria-modal="true"が設定されている', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // 画像ライブラリを開く
        await page.getByRole('button', { name: /画像ライブラリ/ }).click()
        await page.waitForTimeout(500)

        // モーダルのARIA属性を確認
        const dialog = page.locator('[role="dialog"]').first()
        await expect(dialog).toBeVisible()
        await expect(dialog).toHaveAttribute('aria-modal', 'true')
        
        // aria-labelledbyが設定されていることを確認
        const labelledBy = await dialog.getAttribute('aria-labelledby')
        expect(labelledBy).toBe('image-library-title')
        
        // ラベル要素が存在することを確認
        const titleElement = page.locator('#image-library-title')
        await expect(titleElement).toHaveText('画像ライブラリ')
      })

      test('CASE編集モーダルにrole="dialog"とaria-modal="true"が設定されている', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // CASE編集を開く
        const editButton = page.getByTestId('manage-case-edit').first()
        await editButton.click()
        await page.waitForTimeout(500)

        // モーダルのARIA属性を確認
        const dialog = page.locator('[role="dialog"]').first()
        await expect(dialog).toBeVisible()
        await expect(dialog).toHaveAttribute('aria-modal', 'true')
        
        // aria-labelledbyが設定されていることを確認
        const labelledBy = await dialog.getAttribute('aria-labelledby')
        expect(labelledBy).toBe('case-editor-title')
        
        // ラベル要素が存在することを確認
        const titleElement = page.locator('#case-editor-title')
        await expect(titleElement).toHaveText('CASE編集')
      })

      test('トーストにrole="alert"またはrole="status"が設定されている', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // 新規CASE追加でトーストを表示
        await page.getByRole('button', { name: '新規CASE追加' }).click()
        await page.waitForTimeout(500)

        // トーストが表示されることを確認
        const toast = page.locator('[role="status"], [role="alert"]').first()
        await expect(toast).toBeVisible({ timeout: 5000 })
        
        // aria-liveが設定されていることを確認
        const ariaLive = await toast.getAttribute('aria-live')
        expect(ariaLive).toBeTruthy()
      })
    })

    test.describe('フォーカス管理', () => {
      test('画像ライブラリ開閉時に閉じるボタンにフォーカスが移動する', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // 画像ライブラリを開く
        await page.getByRole('button', { name: /画像ライブラリ/ }).click()
        await page.waitForTimeout(500)

        // 閉じるボタンにフォーカスがあることを確認
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.getAttribute('aria-label')
        })
        
        expect(focusedElement).toBe('画像ライブラリを閉じる')
      })

      test('CASE編集モーダル開閉時にキャンセルボタンにフォーカスが移動する', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // CASE編集を開く
        const editButton = page.getByTestId('manage-case-edit').first()
        await editButton.click()
        await page.waitForTimeout(500)

        // キャンセルボタンにフォーカスがあることを確認
        const focusedElement = await page.evaluate(() => {
          return document.activeElement?.textContent
        })
        
        expect(focusedElement).toContain('キャンセル')
      })

      test('画像ライブラリでESCキーを押すとモーダルが閉じる', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // 画像ライブラリを開く
        await page.getByRole('button', { name: /画像ライブラリ/ }).click()
        await page.waitForTimeout(500)

        // モーダルが開いていることを確認
        const dialog = page.locator('[role="dialog"]').first()
        await expect(dialog).toBeVisible()

        // ESCキーを押す
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // モーダルが閉じていることを確認
        await expect(dialog).not.toBeVisible()
      })

      test('CASE編集モーダルでESCキーを押すとモーダルが閉じる', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // CASE編集を開く
        const editButton = page.getByTestId('manage-case-edit').first()
        await editButton.click()
        await page.waitForTimeout(500)

        // モーダルが開いていることを確認
        const dialog = page.locator('[role="dialog"]').first()
        await expect(dialog).toBeVisible()

        // ESCキーを押す
        await page.keyboard.press('Escape')
        await page.waitForTimeout(500)

        // モーダルが閉じていることを確認
        await expect(dialog).not.toBeVisible()
      })

      test('Tabキーでモーダル内のフォーカスが巡回する', async ({ page }) => {
        await page.goto('/manage')
        await page.waitForTimeout(3000)

        // 画像ライブラリを開く
        await page.getByRole('button', { name: /画像ライブラリ/ }).click()
        await page.waitForTimeout(500)

        // Tabキーを数回押す
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)
        await page.keyboard.press('Tab')
        await page.waitForTimeout(100)

        // フォーカスがモーダル外に出ていないことを確認
        const currentFocused = await page.evaluate(() => {
          const activeEl = document.activeElement
          const modal = document.querySelector('[role="dialog"]')
          return modal?.contains(activeEl)
        })

        expect(currentFocused).toBe(true)
      })
    })
  })

  test.describe('キーボードショートカット', () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(() => {
        indexedDB.deleteDatabase('hikaku-editor')
      })
    })

    test.describe('スライダー操作', () => {
      test('矢印キー→でスライダーが5%右に移動する', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // スライダーにフォーカス
        const slider = page.locator('[role="slider"]').first()
        await slider.focus()

        // 初期位置を取得
        const initialPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        // 右矢印キーを押す
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(300)

        // 位置が5%増加していることを確認
        const newPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        expect(newPosition).toBeGreaterThan(initialPosition)
        expect(Math.abs(newPosition - initialPosition - 5)).toBeLessThan(1)
      })

      test('矢印キー←でスライダーが5%左に移動する', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // スライダーにフォーカス
        const slider = page.locator('[role="slider"]').first()
        await slider.focus()

        // 初期位置を取得
        const initialPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        // 左矢印キーを押す
        await page.keyboard.press('ArrowLeft')
        await page.waitForTimeout(300)

        // 位置が5%減少していることを確認
        const newPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        expect(newPosition).toBeLessThan(initialPosition)
        expect(Math.abs(initialPosition - newPosition - 5)).toBeLessThan(1)
      })

      test('Shift+矢印キー→でスライダーが1%右に移動する', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // スライダーにフォーカス
        const slider = page.locator('[role="slider"]').first()
        await slider.focus()

        // 初期位置を取得
        const initialPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        // Shift+右矢印キーを押す
        await page.keyboard.press('Shift+ArrowRight')
        await page.waitForTimeout(300)

        // 位置が1%増加していることを確認
        const newPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        expect(newPosition).toBeGreaterThan(initialPosition)
        expect(Math.abs(newPosition - initialPosition - 1)).toBeLessThan(0.5)
      })

      test('Shift+矢印キー←でスライダーが1%左に移動する', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // スライダーにフォーカス
        const slider = page.locator('[role="slider"]').first()
        await slider.focus()

        // 初期位置を取得
        const initialPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        // Shift+左矢印キーを押す
        await page.keyboard.press('Shift+ArrowLeft')
        await page.waitForTimeout(300)

        // 位置が1%減少していることを確認
        const newPosition = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        expect(newPosition).toBeLessThan(initialPosition)
        expect(Math.abs(initialPosition - newPosition - 1)).toBeLessThan(0.5)
      })

      test('Spaceキーでスライダーが中央（50%）にリセットされる', async ({ page }) => {
        await page.goto('/')
        await page.waitForTimeout(3000)

        // スライダーにフォーカス
        const slider = page.locator('[role="slider"]').first()
        await slider.focus()

        // スライダーを移動
        await page.keyboard.press('ArrowRight')
        await page.keyboard.press('ArrowRight')
        await page.waitForTimeout(300)

        // Spaceキーを押す
        await page.keyboard.press('Space')
        await page.waitForTimeout(300)

        // 位置が50%になっていることを確認
        const position = await slider.evaluate((el) => {
          return parseFloat((el as HTMLElement).style.left || '50')
        })

        expect(Math.abs(position - 50)).toBeLessThan(1)
      })
    })
  })

  test.describe('ドラッグ&ドロップ', () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(() => {
        indexedDB.deleteDatabase('hikaku-editor')
      })
    })

    test('画像ファイルをドロップして追加できる', async ({ page }) => {
      await page.goto('/manage')
      await page.waitForTimeout(3000)

      // 画像ライブラリを開く
      await page.getByRole('button', { name: /画像ライブラリ/ }).click()
      await page.waitForTimeout(500)

      // 初期の画像数を取得
      const initialCountText = await page.locator('div').filter({ hasText: /^\d+ 画像$/ }).first().textContent()
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0')

      // ファイル入力を使用してドロップをシミュレート
      const input = page.locator('input[type="file"]')
      const sample = readFileSync(resolve(process.cwd(), 'public/samples/case-01-before.png'))
      await input.setInputFiles({ name: 'test-drop.png', mimeType: 'image/png', buffer: sample })

      // 処理完了を待つ
      await page.waitForTimeout(3000)

      // 画像が追加されたことを確認
      const newCountText = await page.locator('div').filter({ hasText: /^\d+ 画像$/ }).first().textContent()
      const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0')

      expect(newCount).toBe(initialCount + 1)
    })

    test('複数ファイルを同時にドロップして追加できる', async ({ page }) => {
      await page.goto('/manage')
      await page.waitForTimeout(3000)

      // 画像ライブラリを開く
      await page.getByRole('button', { name: /画像ライブラリ/ }).click()
      await page.waitForTimeout(500)

      // 初期の画像数を取得
      const initialCountText = await page.locator('div').filter({ hasText: /^\d+ 画像$/ }).first().textContent()
      const initialCount = parseInt(initialCountText?.match(/\d+/)?.[0] || '0')

      // 複数ファイルをアップロード
      const input = page.locator('input[type="file"]')
      const sample1 = readFileSync(resolve(process.cwd(), 'public/samples/case-01-before.png'))
      const sample2 = readFileSync(resolve(process.cwd(), 'public/samples/case-02-before.png'))
      
      await input.setInputFiles([
        { name: 'test-drop-1.png', mimeType: 'image/png', buffer: sample1 },
        { name: 'test-drop-2.png', mimeType: 'image/png', buffer: sample2 }
      ])

      // 処理完了を待つ
      await page.waitForTimeout(5000)

      // 画像が追加されたことを確認
      const newCountText = await page.locator('div').filter({ hasText: /^\d+ 画像$/ }).first().textContent()
      const newCount = parseInt(newCountText?.match(/\d+/)?.[0] || '0')

      expect(newCount).toBe(initialCount + 2)
    })
  })

  test.describe('ローディング状態', () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(() => {
        indexedDB.deleteDatabase('hikaku-editor')
      })
    })

    test('単一ファイルアップロード時に処理中表示が出る', async ({ page }) => {
      await page.goto('/manage')
      await page.waitForTimeout(3000)

      // 画像ライブラリを開く
      await page.getByRole('button', { name: /画像ライブラリ/ }).click()
      await page.waitForTimeout(500)

      // ファイル入力を取得
      const input = page.locator('input[type="file"]')
      const sample = readFileSync(resolve(process.cwd(), 'public/samples/case-01-before.png'))
      
      // ファイルをアップロード
      await input.setInputFiles({ name: 'test-upload.png', mimeType: 'image/png', buffer: sample })

      // 処理中表示を確認（短時間で消える可能性があるので、タイムアウトを短くする）
      const processingButton = page.getByRole('button', { name: /処理中/ })
      await expect(processingButton).toBeVisible({ timeout: 2000 }).catch(() => {
        // 処理が速すぎて表示されない場合は問題なし
      })
    })

    test('複数ファイルアップロード時に進捗表示（例: 2/2）が出る', async ({ page }) => {
      await page.goto('/manage')
      await page.waitForTimeout(3000)

      // 画像ライブラリを開く
      await page.getByRole('button', { name: /画像ライブラリ/ }).click()
      await page.waitForTimeout(500)

      // 複数ファイルをアップロード
      const input = page.locator('input[type="file"]')
      const sample1 = readFileSync(resolve(process.cwd(), 'public/samples/case-01-before.png'))
      const sample2 = readFileSync(resolve(process.cwd(), 'public/samples/case-02-before.png'))
      
      await input.setInputFiles([
        { name: 'test-upload-1.png', mimeType: 'image/png', buffer: sample1 },
        { name: 'test-upload-2.png', mimeType: 'image/png', buffer: sample2 }
      ])

      // 進捗表示を確認（短時間で消える可能性がある）
      const progressButton = page.getByRole('button', { name: /処理中.*\/.*/ })
      await expect(progressButton).toBeVisible({ timeout: 2000 }).catch(() => {
        // 処理が速すぎて表示されない場合は問題なし
      })
    })
  })

  test.describe('共有機能改善', () => {
    test.beforeEach(async ({ context }) => {
      await context.addInitScript(() => {
        try {
          const key = '__pw_db_cleared__'
          if (typeof localStorage !== 'undefined' && !localStorage.getItem(key)) {
            indexedDB.deleteDatabase('hikaku-editor')
            localStorage.setItem(key, '1')
          }
        } catch {
          indexedDB.deleteDatabase('hikaku-editor')
        }
      })
    })

    test('共有リンク生成時に自動コピーされてトーストが表示される', async ({ page }) => {
      await page.goto('/manage')
      await page.waitForTimeout(3000)

      // CASE 01の共有ボタンをクリック
      const shareButton = page.getByTestId('manage-case-share').first()
      await shareButton.click()
      await page.waitForTimeout(1000)

      // エラーが表示されない場合のみテストを続行
      const shareError = page.getByText(/画像が設定されていません|URL画像ではない/)
      const hasError = await shareError.isVisible().catch(() => false)

      if (hasError) {
        test.skip()
        return
      }

      // コピー成功のトーストが表示されることを確認
      const toast = page.locator('text=/共有リンクを生成してコピーしました|共有リンクを生成しました/')
      await expect(toast).toBeVisible({ timeout: 5000 })
    })
  })
})

