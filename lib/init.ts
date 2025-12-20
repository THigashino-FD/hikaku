import { v4 as uuidv4 } from 'uuid';
import { getAllCases, addCase, addImage, getAppConfig, setAppConfig, CaseRecord, ImageRecord } from './db';

/**
 * 画像URLからBlobを取得
 */
async function fetchImageAsBlob(url: string): Promise<Blob> {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    throw new Error('fetchImageAsBlob must be called in browser environment');
  }
  
  // 絶対URLに変換
  const absoluteUrl = new URL(url, window.location.origin).href;
  
  const response = await fetch(absoluteUrl);
  if (!response.ok) {
    throw new Error(`Failed to fetch image: ${url} (${response.status})`);
  }
  return await response.blob();
}

/**
 * 画像の寸法を取得
 */
async function getImageDimensionsFromBlob(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const url = URL.createObjectURL(blob);

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url;
  });
}

/**
 * デフォルト画像をIndexedDBに登録
 */
async function setupDefaultImage(
  imagePath: string,
  fileName: string
): Promise<string> {
  try {
    const blob = await fetchImageAsBlob(imagePath);
    const { width, height } = await getImageDimensionsFromBlob(blob);

    const imageRecord: ImageRecord = {
      id: uuidv4(),
      name: fileName,
      type: blob.type,
      size: blob.size,
      blob: blob,
      width,
      height,
      createdAt: Date.now(),
    };

    await addImage(imageRecord);
    return imageRecord.id;
  } catch (error) {
    console.error(`Failed to setup default image: ${imagePath}`, error);
    throw error;
  }
}

/**
 * デフォルトCASEをセットアップ
 */
export async function setupDefaultCases(): Promise<void> {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    console.log('Skipping default cases setup (not in browser)');
    return;
  }

  try {
    // 既にセットアップ済みかチェック
    const isSetup = await getAppConfig('defaultCasesSetup');
    if (isSetup) {
      console.log('Default cases already setup');
      return;
    }

    // 既存のCASEがあるかチェック
    const existingCases = await getAllCases();
    if (existingCases.length > 0) {
      console.log('Cases already exist, skipping default setup');
      await setAppConfig('defaultCasesSetup', true);
      return;
    }

    console.log('Setting up default cases...');

    // CASE 01の画像を登録
    const beforeImage1Id = await setupDefaultImage('/before-house.png', 'before-house.png');
    const afterImage1Id = await setupDefaultImage('/after-house.jpg', 'after-house.jpg');

    // CASE 02の画像を登録
    const beforeImage2Id = await setupDefaultImage('/before-house-2.png', 'before-house-2.png');
    const afterImage2Id = await setupDefaultImage('/after-house-2.jpg', 'after-house-2.jpg');

    // CASE 03の画像を登録
    const beforeImage3Id = await setupDefaultImage('/before-house-3.png', 'before-house-3.png');
    const afterImage3Id = await setupDefaultImage('/after-house-3.png', 'after-house-3.png');

    // CASE 01を作成
    const case1: CaseRecord = {
      id: uuidv4(),
      title: 'CASE 01',
      description: 'デフォルトサンプル',
      order: 0,
      beforeImageId: beforeImage1Id,
      afterImageId: afterImage1Id,
      view: {
        before: { scale: 120, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // CASE 02を作成
    const case2: CaseRecord = {
      id: uuidv4(),
      title: 'CASE 02',
      description: 'デフォルトサンプル',
      order: 1,
      beforeImageId: beforeImage2Id,
      afterImageId: afterImage2Id,
      view: {
        before: { scale: 100, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // CASE 03を作成
    const case3: CaseRecord = {
      id: uuidv4(),
      title: 'CASE 03',
      description: 'デフォルトサンプル',
      order: 2,
      beforeImageId: beforeImage3Id,
      afterImageId: afterImage3Id,
      view: {
        before: { scale: 100, x: 0, y: 0 },
        after: { scale: 100, x: 0, y: 0 },
      },
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // CASEを保存
    await addCase(case1);
    await addCase(case2);
    await addCase(case3);

    // セットアップ完了フラグを保存
    await setAppConfig('defaultCasesSetup', true);

    console.log('Default cases setup completed');
  } catch (error) {
    console.error('Failed to setup default cases:', error);
    throw error;
  }
}

/**
 * 初期化チェック（アプリ起動時に呼び出す）
 */
export async function initializeApp(): Promise<void> {
  try {
    await setupDefaultCases();
  } catch (error) {
    console.error('Failed to initialize app:', error);
    // エラーが発生してもアプリは起動できるようにする
  }
}

