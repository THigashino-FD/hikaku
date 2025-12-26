import { v4 as uuidv4 } from 'uuid';
import { getDB, getAllCases, addCase, addImage, getAppConfig, setAppConfig, CaseRecord, ImageRecord } from './db';
import { sleep } from "./browser";
import { logger } from "./logger";

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
  
  try {
    const response = await fetch(absoluteUrl);
    if (!response.ok) {
      throw new Error(`Failed to fetch image: ${url} (${response.status})`);
    }
    return await response.blob();
  } catch (error) {
      logger.error(`fetchImageAsBlob error: ${url}`, error);
    throw error;
  }
}

/**
 * 画像の寸法を取得
 */
async function getImageDimensionsFromBlob(blob: Blob): Promise<{ width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    let url: string | undefined;
    
    try {
      url = URL.createObjectURL(blob);
    } catch {
      reject(new Error('Failed to create object URL'));
      return;
    }

    img.onload = () => {
      resolve({ width: img.width, height: img.height });
      if (url) URL.revokeObjectURL(url);
    };

    img.onerror = () => {
      if (url) URL.revokeObjectURL(url);
      reject(new Error('Failed to load image'));
    };

    img.src = url!;
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
      logger.error(`Failed to setup default image: ${imagePath}`, error);
    throw error;
  }
}

/**
 * デフォルトCASEをセットアップ
 */
export async function setupDefaultCases(): Promise<void> {
  // ブラウザ環境でのみ実行
  if (typeof window === 'undefined') {
    return;
  }

  try {
    // 既にセットアップ済みかチェック
    const isSetup = await getAppConfig('defaultCasesSetup');
    
    // 既存のCASEがあるかチェック（WebKitでのタイミング問題を回避するため、リトライ付き）
    let existingCases: CaseRecord[] = [];
    let retryCount = 0;
    const maxRetries = 3;
    
    while (retryCount < maxRetries) {
      try {
        existingCases = await getAllCases();
        break;
      } catch (error) {
        retryCount++;
        if (retryCount >= maxRetries) {
          logger.error('[INIT] Failed to get existing cases after retries:', error);
          throw error;
        }
        await new Promise(resolve => setTimeout(resolve, 100 * retryCount));
      }
    }
    
    // 既存CASEがある場合はスキップ（ただし、フラグが設定されていない場合は設定する）
    if (existingCases.length > 0) {
      if (!isSetup) {
        await setAppConfig('defaultCasesSetup', true);
        // WebKitでのトランザクション完了を確実にするため、少し待機
        await new Promise(resolve => setTimeout(resolve, 100));
      }
      return;
    }
    
    // フラグが設定されているがCASEが存在しない場合は、フラグをリセットして再セットアップ
    if (isSetup && existingCases.length === 0) {
      logger.warn('[INIT] defaultCasesSetup flag is set but no cases exist, resetting flag and setting up...');
      await setAppConfig('defaultCasesSetup', false);
      await new Promise(resolve => setTimeout(resolve, 100));
    }

    const safeSetup = async (path: string, name: string) => {
      try {
        const imageId = await setupDefaultImage(path, name);
        return imageId;
      } catch (e) {
        logger.error(`[INIT] Failed to setup ${path}:`, e);
        return undefined;
      }
    };

    const beforeImage1Id = await safeSetup('/samples/case-01-before.png', 'case-01-before.png');
    const afterImage1Id = await safeSetup('/samples/case-01-after.jpg', 'case-01-after.jpg');
    const beforeImage2Id = await safeSetup('/samples/case-02-before.png', 'case-02-before.png');
    const afterImage2Id = await safeSetup('/samples/case-02-after.jpg', 'case-02-after.jpg');
    const beforeImage3Id = await safeSetup('/samples/case-03-before.png', 'case-03-before.png');
    const afterImage3Id = await safeSetup('/samples/case-03-after.png', 'case-03-after.png');
    
    // 画像のセットアップに失敗した場合は警告
    const failedImages: string[] = [];
    if (!beforeImage1Id) failedImages.push('case-01-before.png');
    if (!afterImage1Id) failedImages.push('case-01-after.jpg');
    if (!beforeImage2Id) failedImages.push('case-02-before.png');
    if (!afterImage2Id) failedImages.push('case-02-after.jpg');
    if (!beforeImage3Id) failedImages.push('case-03-before.png');
    if (!afterImage3Id) failedImages.push('case-03-after.png');
    
    if (failedImages.length > 0) {
      logger.warn(`[INIT] Failed to setup ${failedImages.length} images:`, failedImages);
    }

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
      initialSliderPosition: 50,
      animationType: 'demo',
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
      initialSliderPosition: 50,
      animationType: 'none',
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
      initialSliderPosition: 50,
      animationType: 'none',
      createdAt: Date.now(),
      updatedAt: Date.now(),
    };

    // CASEを保存（WebKitでのトランザクション完了を確実にするため、検証付きで順次実行）
    const saveAndVerify = async (c: CaseRecord) => {
      await addCase(c);
      await new Promise(resolve => setTimeout(resolve, 100));
      const all = await getAllCases();
      if (!all.find(item => item.id === c.id)) {
        throw new Error(`Failed to verify case save: ${c.title}`);
      }
    };

    // 画像が存在する場合のみCASEを作成
    if (beforeImage1Id && afterImage1Id) {
      await saveAndVerify(case1);
    } else {
      logger.warn('[INIT] Skipping CASE 01 due to missing images');
    }
    
    if (beforeImage2Id && afterImage2Id) {
      await saveAndVerify(case2);
    } else {
      logger.warn('[INIT] Skipping CASE 02 due to missing images');
    }
    
    if (beforeImage3Id && afterImage3Id) {
      await saveAndVerify(case3);
    } else {
      logger.warn('[INIT] Skipping CASE 03 due to missing images');
    }

    // セットアップ完了フラグを保存
    await setAppConfig('defaultCasesSetup', true);
    await new Promise(resolve => setTimeout(resolve, 100));
  } catch (error) {
    logger.error('Failed to setup default cases:', error);
    throw error;
  }
}

/**
 * 初期化チェック（アプリ起動時に呼び出す）
 */
export async function initializeApp(): Promise<void> {
  // 同一セッション内の多重実行を避ける（ページ遷移/再描画/保存後の再読み込みなど）
  if (initializeAppState.done) {
    // 既に初期化済みでも、CASEが存在しない場合は再実行
    try {
      const existingCases = await getAllCases();
      if (existingCases.length === 0) {
        initializeAppState.done = false;
        initializeAppState.inFlight = null;
      } else {
        return;
      }
    } catch (error) {
      logger.error('[INIT] Error checking existing cases:', error);
      // エラーが発生した場合は再試行
      initializeAppState.done = false;
      initializeAppState.inFlight = null;
    }
  }
  
  if (initializeAppState.inFlight) {
    return initializeAppState.inFlight;
  }

  initializeAppState.inFlight = (async () => {
    let setupOk = false;

    // WebKitでのIndexedDBの準備を待つ
    if (typeof window !== 'undefined') {
        try {
          if (!('indexedDB' in window)) {
            logger.error('[INIT] IndexedDB is not available');
            return;
        }
        
        let dbReady = false;
        let retryCount = 0;
        const maxRetries = 3;
        
        while (!dbReady && retryCount < maxRetries) {
          try {
            await getDB();
            dbReady = true;
          } catch (dbError) {
            retryCount++;
            if (retryCount >= maxRetries) throw dbError;
            await sleep(200 * retryCount);
          }
          }
        } catch (dbError) {
          logger.error('[INIT] Failed to initialize database:', dbError);
        }
    }
  
    try {
      await setupDefaultCases();
      setupOk = true;
    } catch (error) {
      logger.error('Failed to initialize app:', error);
      
      // WebKitでのIndexedDBエラーの場合、リトライ
      const isIndexedDBError = error instanceof Error && (
        error.message.includes('IndexedDB') || 
        error.message.includes('database') ||
        error.name === 'UnknownError' ||
        error.name === 'QuotaExceededError' ||
        error.message.includes('quota') ||
        error.message.includes('Blob')
      );
      
      if (isIndexedDBError) {
        await sleep(1000);
        try {
          const { resetDBInstance } = await import('./db');
          resetDBInstance();
          await setupDefaultCases();
          setupOk = true;
        } catch (retryError) {
          logger.error('[INIT] Retry also failed:', retryError);
        }
      }
      
      logger.warn('[INIT] Continuing despite initialization error');
    }

    // 初期化が成功した場合のみ「done」として固定し、失敗時は次回呼び出しで再試行できるようにする
    if (setupOk) {
      initializeAppState.done = true;
    } else {
      initializeAppState.inFlight = null;
    }
  })();

  return initializeAppState.inFlight;
}

const initializeAppState: {
  inFlight: Promise<void> | null;
  done: boolean;
} = {
  inFlight: null,
  done: false,
};
