/**
 * 画像をリサイズして最適化する
 * @param file 元画像ファイル
 * @param maxDimension 長辺の最大サイズ（デフォルト2000px）
 * @param quality 画質（0-1、デフォルト0.9）
 * @returns 最適化されたBlob、元の幅/高さ、リサイズ後の幅/高さ
 */
export async function resizeImage(
  file: File,
  maxDimension: number = 2000,
  quality: number = 0.9
): Promise<{
  blob: Blob;
  originalWidth: number;
  originalHeight: number;
  width: number;
  height: number;
}> {
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

    img.onload = () => {
      const originalWidth = img.width;
      const originalHeight = img.height;

      // リサイズが必要かチェック
      let width = originalWidth;
      let height = originalHeight;

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
        reject(new Error('Failed to get canvas context'));
        return;
      }

      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (!blob) {
            reject(new Error('Failed to create blob'));
            return;
          }

          resolve({
            blob,
            originalWidth,
            originalHeight,
            width,
            height,
          });
        },
        file.type,
        quality
      );
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
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
 * 画像の次元を取得
 */
export async function getImageDimensions(
  file: File
): Promise<{ width: number; height: number }> {
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

    img.onload = () => {
      resolve({
        width: img.width,
        height: img.height,
      });
    };

    img.onerror = () => {
      reject(new Error('Failed to load image'));
    };

    reader.onerror = () => {
      reject(new Error('Failed to read file'));
    };

    reader.readAsDataURL(file);
  });
}

/**
 * 画像ファイルかどうかをチェック
 */
export function isImageFile(file: File): boolean {
  return file.type.startsWith('image/');
}

/**
 * 許可された画像形式かをチェック
 */
export function isAllowedImageType(file: File): boolean {
  const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
  return allowedTypes.includes(file.type);
}

