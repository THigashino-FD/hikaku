/**
 * FileをImageオブジェクトとして読み込む
 */
async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('Failed to read file'));
        return;
      }
      img.src = e.target.result as string;
    };

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('Failed to load image'));
    reader.onerror = () => reject(new Error('Failed to read file'));

    reader.readAsDataURL(file);
  });
}

/**
 * 画像をリサイズして最適化する
 * @param file 元画像ファイル
 * @param maxDimension 長辺の最大サイズ（デフォルト2000px）
 * @param quality 画質（0-1、デフォルト0.9）
 * @returns 最適化されたBlob、リサイズ後の幅/高さ
 */
export async function resizeImage(
  file: File,
  maxDimension: number = 2000,
  quality: number = 0.9
): Promise<{
  blob: Blob;
  width: number;
  height: number;
}> {
  const img = await fileToImage(file);

  // リサイズが必要かチェック
  let width = img.width;
  let height = img.height;

  if (width > maxDimension || height > maxDimension) {
    if (width > height) {
      height = Math.round((height * maxDimension) / width);
      width = maxDimension;
    } else {
      width = Math.round((width * maxDimension) / height);
      height = maxDimension;
    }
  }

  // Canvas にリサイズして描画
  const canvas = document.createElement('canvas');
  canvas.width = width;
  canvas.height = height;

  const ctx = canvas.getContext('2d');
  if (!ctx) {
    throw new Error('Failed to get canvas context');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Failed to create blob'));
          return;
        }

        resolve({
          blob,
          width,
          height,
        });
      },
      file.type,
      quality
    );
  });
}

/**
 * ファイルサイズを人間が読める形式にフォーマット
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';

  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
}

/**
 * 許可された画像形式かをチェック
 */
export function isAllowedImageType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

/**
 * URLから画像を取得してBlobとして返す
 */
export async function fetchImageFromUrl(url: string): Promise<Blob> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:113',message:'fetchImageFromUrl called',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  try {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:115',message:'fetch starting',data:{url,mode:'cors',credentials:'omit'},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:120',message:'fetch response received',data:{url,status:response.status,statusText:response.statusText,ok:response.ok,contentType:response.headers.get('content-type')},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    
    if (!response.ok) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:122',message:'response not ok',data:{url,status:response.status,statusText:response.statusText},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'D'})}).catch(()=>{});
      }
      // #endregion
      throw new Error(`画像の取得に失敗しました (HTTP ${response.status}): ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:128',message:'blob created',data:{url,blobSize:blob.size,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    
    // 画像形式の確認
    if (!blob.type.startsWith('image/')) {
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:131',message:'blob is not image',data:{url,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'E'})}).catch(()=>{});
      }
      // #endregion
      throw new Error(`取得したコンテンツは画像ではありません (Content-Type: ${blob.type}). Google Driveの共有ページURLではなく、画像として直接アクセスできるURLを使用してください。`);
    }
    
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:135',message:'fetchImageFromUrl succeeded',data:{url,blobSize:blob.size,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
    }
    // #endregion
    return blob;
  } catch (error: unknown) {
    // #region agent log
    if (typeof window !== 'undefined') {
      fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:137',message:'fetchImageFromUrl error',data:{url,error:error instanceof Error?error.message:String(error),errorName:error instanceof Error?error.name:'Unknown',isFailedToFetch:error instanceof Error?error.message.includes('Failed to fetch'):false},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
    }
    // #endregion
    // ネットワークエラー（CORS含む）の詳細化
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      // CORSエラーの場合、APIルート経由で再試行
      // #region agent log
      if (typeof window !== 'undefined') {
        fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:141',message:'trying API route fallback',data:{url},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
      }
      // #endregion
      try {
        const apiResponse = await fetch('/api/fetch-image', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({ url }),
        });

        if (!apiResponse.ok) {
          const errorData = await apiResponse.json();
          throw new Error(errorData.error || '画像の取得に失敗しました');
        }

        const { dataUrl, contentType } = await apiResponse.json();
        
        // Data URLからBlobに変換
        const response = await fetch(dataUrl);
        const blob = await response.blob();
        
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:158',message:'API route fallback succeeded',data:{url,blobSize:blob.size,blobType:blob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        }
        // #endregion
        
        return blob;
      } catch (apiError) {
        // #region agent log
        if (typeof window !== 'undefined') {
          fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:163',message:'API route fallback failed',data:{url,error:apiError instanceof Error?apiError.message:String(apiError)},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'C'})}).catch(()=>{});
        }
        // #endregion
        throw new Error('画像の取得に失敗しました。CORS（Cross-Origin）制約、またはネットワークエラーの可能性があります。Google Driveを使用している場合は、共有設定を「リンクを知っている全員」にして、直接ダウンロード用のURLを使用してください。');
      }
    }
    throw error;
  }
}

/**
 * BlobをFileオブジェクトに変換
 */
export function blobToFile(blob: Blob, filename: string): File {
  return new File([blob], filename, { type: blob.type });
}

/**
 * URLから画像を取得して最適化（リサイズ）
 */
export async function fetchAndResizeImage(
  url: string,
  maxDimension: number = 2000,
  quality: number = 0.9
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  type: string;
}> {
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:151',message:'fetchAndResizeImage called',data:{url,maxDimension,quality},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  // URLから画像を取得
  const originalBlob = await fetchImageFromUrl(url);
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:163',message:'originalBlob received',data:{url,blobSize:originalBlob.size,blobType:originalBlob.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  // BlobからFileを作成（resizeImage関数がFile型を期待しているため）
  const filename = url.split('/').pop() || 'image.jpg';
  const file = blobToFile(originalBlob, filename);
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:168',message:'calling resizeImage',data:{url,filename,fileType:file.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  // リサイズ処理
  const result = await resizeImage(file, maxDimension, quality);
  
  // #region agent log
  if (typeof window !== 'undefined') {
    fetch('http://127.0.0.1:7242/ingest/434cdba6-86e2-4549-920e-ecd270128146',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({location:'image-utils.ts:171',message:'fetchAndResizeImage succeeded',data:{url,width:result.width,height:result.height,blobSize:result.blob.size,type:file.type},timestamp:Date.now(),sessionId:'debug-session',runId:'run1',hypothesisId:'B'})}).catch(()=>{});
  }
  // #endregion
  
  return {
    ...result,
    type: file.type,
  };
}

