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
  try {
    const response = await fetch(url, {
      mode: 'cors',
      credentials: 'omit',
    });
    
    if (!response.ok) {
      throw new Error(`画像の取得に失敗しました (HTTP ${response.status}): ${response.statusText}`);
    }
    
    const blob = await response.blob();
    
    // 画像形式の確認
    if (!blob.type.startsWith('image/')) {
      throw new Error(`取得したコンテンツは画像ではありません (Content-Type: ${blob.type}). Google Driveの共有ページURLではなく、画像として直接アクセスできるURLを使用してください。`);
    }
    
    return blob;
  } catch (error: unknown) {
    // ネットワークエラー（CORS含む）の詳細化
    if (error instanceof Error && (error.message.includes('Failed to fetch') || error.name === 'TypeError')) {
      // CORSエラーの場合、APIルート経由で再試行
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
        
        return blob;
      } catch (apiError) {
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
  // URLから画像を取得
  const originalBlob = await fetchImageFromUrl(url);
  
  // BlobからFileを作成（resizeImage関数がFile型を期待しているため）
  const filename = url.split('/').pop() || 'image.jpg';
  const file = blobToFile(originalBlob, filename);
  
  // リサイズ処理
  const result = await resizeImage(file, maxDimension, quality);
  
  return {
    ...result,
    type: file.type,
  };
}

