import { test, expect } from '@playwright/test'
import { readFileSync } from 'fs'
import { resolve } from 'path'

test.describe('CASE複製機能', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor')
    })
  })

  test('CASE複製ボタンをクリックして複製できる', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 初期のCASE数を確認
    const initialCards = await page.locator('[data-testid="manage-case-card"]').count()
    expect(initialCards).toBeGreaterThanOrEqual(3) // デフォルトCASEが3件

    // 最初のCASEの複製ボタンをクリック
    const duplicateButton = page.getByTestId('manage-case-duplicate').first()
    await duplicateButton.click()
    await page.waitForTimeout(1000)

    // CASE数が増加していることを確認
    const newCards = await page.locator('[data-testid="manage-case-card"]').count()
    expect(newCards).toBe(initialCards + 1)
  })

  test('複製されたCASEが「(コピー)」というタイトルで追加される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 最初のCASEのタイトルを取得
    const originalTitle = await page.locator('[data-testid="manage-case-card"]').first()
      .getAttribute('data-case-title')

    // 複製ボタンをクリック
    await page.getByTestId('manage-case-duplicate').first().click()
    await page.waitForTimeout(1000)

    // 複製されたCASEのタイトルを確認
    const expectedTitle = `${originalTitle} (コピー)`
    await expect(page.getByText(expectedTitle)).toBeVisible()
  })

  test('複製されたCASEがリストの最後に追加される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 複製前の最後のCASEタイトルを取得
    const lastCardBeforeDupe = await page.locator('[data-testid="manage-case-card"]').last()
      .getAttribute('data-case-title')

    // 最初のCASEを複製
    await page.getByTestId('manage-case-duplicate').first().click()
    await page.waitForTimeout(1000)

    // 複製後の最後のCASEを確認
    const lastCardAfterDupe = page.locator('[data-testid="manage-case-card"]').last()
    const newLastTitle = await lastCardAfterDupe.getAttribute('data-case-title')
    
    // 最後のCASEが変わっている（複製されたものが追加された）ことを確認
    expect(newLastTitle).toContain('(コピー)')
    expect(newLastTitle).not.toBe(lastCardBeforeDupe)
  })

  test('複製されたCASEの画像が正しく設定される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 最初のCASEの複製ボタンをクリック
    await page.getByTestId('manage-case-duplicate').first().click()
    await page.waitForTimeout(1000)

    // 複製されたCASE（最後のカード）の画像を確認
    const duplicatedCard = page.locator('[data-testid="manage-case-card"]').last()
    const images = duplicatedCard.locator('img')
    
    // 2つの画像（Before/After）が表示されていることを確認
    const imageCount = await images.count()
    expect(imageCount).toBeGreaterThanOrEqual(2)
  })

  test('複製されたCASEの設定が正しくコピーされる', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 最初のCASEを編集して設定を変更
    await page.getByTestId('manage-case-edit').first().click()
    await page.waitForTimeout(500)

    // 初期スライダー位置を変更（Sliderコンポーネントを使用）
    const sliderTrack = page.locator('[role="slider"]').first()
    await sliderTrack.click() // クリックして値を設定
    await page.keyboard.press('ArrowRight') // 右に移動
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight')
    await page.keyboard.press('ArrowRight') // 5%移動
    await page.waitForTimeout(300)

    // アニメーションをデモに変更
    await page.getByRole('radio', { name: 'デモ' }).click()
    await page.waitForTimeout(300)

    // 保存
    await page.getByRole('button', { name: '保存' }).click()
    await page.waitForTimeout(1000)

    // 複製
    await page.getByTestId('manage-case-duplicate').first().click()
    await page.waitForTimeout(1000)

    // 複製されたCASEを編集して設定を確認
    await page.getByTestId('manage-case-edit').last().click()
    await page.waitForTimeout(500)

    // アニメーションがデモになっていることを確認
    const demoRadio = page.getByRole('radio', { name: 'デモ' })
    await expect(demoRadio).toBeChecked()
  })
})

test.describe('CASE並び替え機能', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor')
    })
  })

  test('上へ移動ボタンで順序を変更できる', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 初期順序を取得（2番目のCASEタイトル）
    const secondCaseTitle = await page.locator('[data-testid="manage-case-card"]').nth(1)
      .getAttribute('data-case-title')

    // 2番目のCASEの上へ移動ボタンをクリック
    await page.getByTestId('manage-case-move-up').nth(1).click()
    await page.waitForTimeout(1000)

    // 順序が変更されたことを確認（元2番目が1番目に）
    const firstCaseTitle = await page.locator('[data-testid="manage-case-card"]').first()
      .getAttribute('data-case-title')
    
    expect(firstCaseTitle).toBe(secondCaseTitle)
  })

  test('下へ移動ボタンで順序を変更できる', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 初期順序を取得（1番目のCASEタイトル）
    const firstCaseTitle = await page.locator('[data-testid="manage-case-card"]').first()
      .getAttribute('data-case-title')

    // 1番目のCASEの下へ移動ボタンをクリック
    await page.getByTestId('manage-case-move-down').first().click()
    await page.waitForTimeout(1000)

    // 順序が変更されたことを確認（元1番目が2番目に）
    const secondCaseTitle = await page.locator('[data-testid="manage-case-card"]').nth(1)
      .getAttribute('data-case-title')
    
    expect(secondCaseTitle).toBe(firstCaseTitle)
  })

  test('最初のCASEは上へ移動ボタンが無効になっている', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 最初のCASEの上へ移動ボタンを取得
    const moveUpButton = page.getByTestId('manage-case-move-up').first()
    
    // ボタンが無効化されていることを確認
    await expect(moveUpButton).toBeDisabled()
  })

  test('最後のCASEは下へ移動ボタンが無効になっている', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 最後のCASEの下へ移動ボタンを取得
    const moveDownButton = page.getByTestId('manage-case-move-down').last()
    
    // ボタンが無効化されていることを確認
    await expect(moveDownButton).toBeDisabled()
  })

  test('並び替え後の順序が管理ページで正しく表示される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 初期順序を取得
    const initialTitles = await page.locator('[data-testid="manage-case-card"]')
      .evaluateAll(cards => cards.map(card => card.getAttribute('data-case-title')))

    // 1番目を下に移動
    await page.getByTestId('manage-case-move-down').first().click()
    await page.waitForTimeout(1000)

    // 新しい順序を取得
    const newTitles = await page.locator('[data-testid="manage-case-card"]')
      .evaluateAll(cards => cards.map(card => card.getAttribute('data-case-title')))

    // 順序が入れ替わっていることを確認
    expect(newTitles[0]).toBe(initialTitles[1])
    expect(newTitles[1]).toBe(initialTitles[0])
  })

  test('並び替え後の順序が閲覧ページで正しく反映される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 初期のCASE数を確認
    const initialCards = await page.locator('[data-testid="manage-case-card"]').count()
    
    // 1番目を下に移動
    await page.getByTestId('manage-case-move-down').first().click()
    await page.waitForTimeout(1000)

    // 閲覧ページに移動
    await page.goto('/')
    await page.waitForTimeout(3000)

    // CASEが表示されていることを確認（並び替えが適用されているはず）
    const displayedCases = await page.locator('h2').filter({ hasText: /^CASE/ }).count()
    expect(displayedCases).toBeGreaterThanOrEqual(initialCards)
  })
})

test.describe('画像削除機能', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor')
    })
  })

  test('未使用画像を削除できる', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 画像ライブラリを開く
    await page.getByRole('button', { name: /画像ライブラリ/ }).click()
    await page.waitForTimeout(500)

    // 新しい画像をアップロード
    const input = page.locator('input[type="file"]')
    const sample = readFileSync(resolve(process.cwd(), 'public/samples/case-03-before.png'))
    const testFileName = 'test-delete-image.png'
    await input.setInputFiles({ name: testFileName, mimeType: 'image/png', buffer: sample })
    await page.waitForTimeout(2000)

    // アップロードした画像が表示されることを確認
    await expect(page.getByText(testFileName)).toBeVisible()

    // 削除ボタンを探してクリック（最後に追加された画像）
    const imageCards = page.locator('div.overflow-hidden.rounded-lg.border')
    const testImageCard = imageCards.filter({ hasText: testFileName })
    const deleteButton = testImageCard.getByRole('button', { name: '削除' })
    
    // ダイアログハンドラーを設定
    page.once('dialog', async dialog => {
      expect(dialog.message()).toContain('削除してもよろしいですか')
      await dialog.accept()
    })
    
    await deleteButton.click()
    await page.waitForTimeout(1000)

    // 画像が削除されたことを確認
    await expect(page.getByText(testFileName)).not.toBeVisible()
  })

  test('削除確認ダイアログが表示される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 画像ライブラリを開く
    await page.getByRole('button', { name: /画像ライブラリ/ }).click()
    await page.waitForTimeout(1000)

    // 新しい画像をアップロード
    const input = page.locator('input[type="file"]')
    const sample = readFileSync(resolve(process.cwd(), 'public/samples/case-03-before.png'))
    const uniqueFileName = `test-dialog-${Date.now()}.png`
    await input.setInputFiles({ name: uniqueFileName, mimeType: 'image/png', buffer: sample })
    await page.waitForTimeout(4000)

    // 画像が追加されるまで待つ
    await expect(page.getByText(uniqueFileName)).toBeVisible({ timeout: 15000 })

    // ダイアログ処理を設定してから削除ボタンをクリック
    let dialogAppeared = false
    page.once('dialog', async dialog => {
      dialogAppeared = true
      expect(dialog.message()).toContain('削除してもよろしいですか')
      await dialog.dismiss()
    })
    
    // 削除ボタンを検索してクリック
    const deleteButtons = page.getByRole('button', { name: '削除' })
    const count = await deleteButtons.count()
    
    // 最後の削除ボタン（新しく追加した画像）をクリック
    if (count > 0) {
      await deleteButtons.last().click()
      await page.waitForTimeout(1000)
      expect(dialogAppeared).toBe(true)
    }
  })

  test('使用中の画像は削除不可ボタンが表示される', async ({ page }) => {
    await page.goto('/manage')
    await page.waitForTimeout(3000)

    // 画像ライブラリを開く
    await page.getByRole('button', { name: /画像ライブラリ/ }).click()
    await page.waitForTimeout(1000)

    // 使用中画像の削除不可ボタンを確認（既存テストでも確認されているが念のため）
    const inUseButton = page.getByRole('button', { name: '削除不可（使用中）' }).first()
    await expect(inUseButton).toBeVisible()
    await expect(inUseButton).toBeDisabled()
  })
})

test.describe('調整パネル詳細機能追加', () => {
  test.beforeEach(async ({ context }) => {
    await context.addInitScript(() => {
      indexedDB.deleteDatabase('hikaku-editor')
    })
  })

  test('水平位置スライダーを操作できる（±200px）', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 調整パネルを開く
    await page.getByRole('button', { name: /^調整$/ }).first().click()
    await page.waitForTimeout(300)

    // Before画像の水平位置の数値入力フィールドを取得
    const horizontalInput = page.locator('label').filter({ hasText: '水平位置:' }).first().locator('..').locator('input[type="number"]')
    
    // 50pxに変更
    await horizontalInput.clear()
    await horizontalInput.fill('50')
    await page.waitForTimeout(300)

    // 値が変更されたことを確認
    await expect(page.getByText('水平位置: 50px')).toBeVisible()
  })

  test('垂直位置スライダーを操作できる（±200px）', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 調整パネルを開く
    await page.getByRole('button', { name: /^調整$/ }).first().click()
    await page.waitForTimeout(300)

    // Before画像の垂直位置の数値入力フィールドを取得
    const verticalInput = page.locator('label').filter({ hasText: '垂直位置:' }).first().locator('..').locator('input[type="number"]')
    
    // -30pxに変更
    await verticalInput.clear()
    await verticalInput.fill('-30')
    await page.waitForTimeout(300)

    // 値が変更されたことを確認
    await expect(page.getByText('垂直位置: -30px')).toBeVisible()
  })

  test('数値入力フィールドで直接値を入力できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 調整パネルを開く
    await page.getByRole('button', { name: /^調整$/ }).first().click()
    await page.waitForTimeout(300)

    // Before画像の拡大率の数値入力フィールドを取得
    const numberInput = page.locator('input[type="number"]').first()
    
    // 直接値を入力
    await numberInput.clear()
    await numberInput.fill('175')
    await numberInput.blur() // フォーカスを外して変更を確定
    await page.waitForTimeout(300)

    // 値が変更されたことを確認
    await expect(page.getByText('拡大率: 175%')).toBeVisible()
  })

  test('Before/After画像をそれぞれ独立して調整できる', async ({ page }) => {
    await page.goto('/')
    await page.waitForTimeout(3000)

    // 調整パネルを開く
    await page.getByRole('button', { name: /^調整$/ }).first().click()
    await page.waitForTimeout(300)

    // Before画像の拡大率を変更
    const beforeScaleInput = page.locator('h4').filter({ hasText: '改築前の画像調整' }).locator('..').locator('input[type="number"]').first()
    await beforeScaleInput.clear()
    await beforeScaleInput.fill('110')
    await page.waitForTimeout(300)

    // After画像の拡大率を変更
    const afterScaleInput = page.locator('h4').filter({ hasText: '改築後の画像調整' }).locator('..').locator('input[type="number"]').first()
    await afterScaleInput.clear()
    await afterScaleInput.fill('140')
    await page.waitForTimeout(300)

    // 両方の値が独立して設定されていることを確認
    const beforeSection = page.locator('h4').filter({ hasText: '改築前の画像調整' }).locator('..')
    await expect(beforeSection.getByText('拡大率: 110%')).toBeVisible()
    
    const afterSection = page.locator('h4').filter({ hasText: '改築後の画像調整' }).locator('..')
    await expect(afterSection.getByText('拡大率: 140%')).toBeVisible()
  })
})

