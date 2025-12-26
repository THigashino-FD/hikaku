import { NextRequest } from 'next/server';
import { fetchImageAction } from '@/app/actions/fetch-image';
import { apiSuccess, apiError } from '@/lib/api-helpers';
import { toApiError } from '@/lib/types/errors';
import { safeParse } from '@/lib/types';
import { logger, generateRequestId, withRequestContext, getCurrentMeta } from '@/lib/logger';
import { z } from 'zod';

/**
 * 画像取得リクエストのスキーマ
 */
const FetchImageRequestSchema = z.object({
  url: z.string().url('有効なURLを指定してください'),
});

/**
 * 画像取得レスポンスの型
 */
interface FetchImageResponse {
  dataUrl: string;
  contentType: string;
  size: number;
}

/**
 * 外部URLから画像を取得するAPI Route
 * 統一APIパターンに準拠した実装
 */
export async function POST(request: NextRequest) {
  return withRequestContext(
    { requestId: generateRequestId() },
    async () => {
      const meta = getCurrentMeta()
      logger.log(meta, 'POST /api/fetch-image')
      
      try {
        // リクエストボディの取得
        const body = await request.json();
        
        // バリデーション
        const validation = safeParse(FetchImageRequestSchema, body);
        
        if (!validation.success) {
          logger.warn(meta, 'Validation failed:', validation.error)
          return apiError(validation.error);
        }
        
        // Server Actionを呼び出してロジックを実行
        const result = await fetchImageAction(validation.data.url);
        
        if (!result.success) {
          // 統一エラーモデルをAPI形式に変換
          logger.warn(meta, 'fetchImageAction failed:', result.error.code)
          return apiError(toApiError(result.error));
        }

        // 成功レスポンス
        const responseData: FetchImageResponse = {
          dataUrl: result.data.dataUrl,
          contentType: result.data.contentType,
          size: result.data.size,
        };
        
        logger.log(meta, 'POST /api/fetch-image success')
        return apiSuccess(responseData);
        
      } catch (error) {
        logger.error(meta, 'POST /api/fetch-image error:', error)
        return apiError({
          code: 'INTERNAL_ERROR',
          message: error instanceof Error ? error.message : 'サーバーエラーが発生しました',
          statusCode: 500,
        });
      }
    }
  )
}




