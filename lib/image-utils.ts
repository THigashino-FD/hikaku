import { IMAGE_CONSTANTS } from '@/lib/constants';
import { AppErrors, type AppError } from '@/lib/types/errors';
import { withRetry, IMAGE_FETCH_RETRY_CONFIG } from '@/lib/retry';

/**
 * FileをImageオブジェクトとして読み込む
 */
async function fileToImage(file: File): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const reader = new FileReader();

    reader.onload = (e) => {
      if (!e.target?.result) {
        reject(new Error('ファイルの読み込みに失敗しました'));
        return;
      }
      img.src = e.target.result as string;
    };

    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('画像の読み込みに失敗しました'));
    reader.onerror = () => reject(new Error('ファイルの読み込みに失敗しました'));

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
    throw new Error('Canvas contextの取得に失敗しました');
  }

  ctx.drawImage(img, 0, 0, width, height);

  return new Promise((resolve, reject) => {
    canvas.toBlob(
      (blob) => {
        if (!blob) {
          reject(new Error('Blobの作成に失敗しました'));
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
  return IMAGE_CONSTANTS.ALLOWED_TYPES.includes(file.type as typeof IMAGE_CONSTANTS.ALLOWED_TYPES[number]);
}

/**
 * 画像取得結果
 */
export type FetchImageResult = 
  | { success: true; blob: Blob }
  | { success: false; error: AppError }

/**
 * URLから画像を取得してBlobとして返す（Server Action経由、リトライ付き）
 * CORS制限を回避するため、Server Action経由で取得します
 */
export async function fetchImageFromUrl(url: string): Promise<Blob> {
  // Server Action経由で取得（CORS回避、リトライ付き）
  const retryResult = await withRetry(
    async () => {
      const { fetchImageAction } = await import('@/app/actions/fetch-image')
      const result = await fetchImageAction(url)
      
      if (!result.success) {
        throw result.error
      }
      
      return result.data
    },
    IMAGE_FETCH_RETRY_CONFIG
  )
  
  if (!retryResult.success) {
    throw retryResult.error
  }

  // Data URLからBlobに変換
  const response = await fetch(retryResult.data.dataUrl)
  const blob = await response.blob()
  
  return blob
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
  maxDimension: number = IMAGE_CONSTANTS.MAX_DIMENSION,
  quality: number = IMAGE_CONSTANTS.QUALITY
): Promise<{
  blob: Blob;
  width: number;
  height: number;
  type: string;
}> {
  // URLから画像を取得（リトライ＆フォールバック付き）
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

