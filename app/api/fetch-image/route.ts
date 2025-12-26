import { NextRequest, NextResponse } from 'next/server';
import { fetchImageAction } from '@/app/actions/fetch-image';
import { logger } from '@/lib/logger';

/**
 * 外部URLから画像を取得するAPI Route
 * 内部でServer Actionを呼び出すことで、ロジックを一本化
 */
export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      );
    }

    // Server Actionを呼び出してロジックを実行
    const result = await fetchImageAction(url);
    
    if (result.error) {
      // エラーメッセージに応じて適切なステータスコードを返す
      let status = 500;
      if (result.error.includes('プライベートIP') || 
          result.error.includes('許可されていないホスト') ||
          result.error.includes('HTTPSのみ')) {
        status = 403;
      } else if (result.error.includes('無効なURL') || 
                 result.error.includes('画像ではありません')) {
        status = 400;
      } else if (result.error.includes('大きすぎます')) {
        status = 413;
      } else if (result.error.includes('タイムアウト')) {
        status = 504;
      } else if (result.error.includes('取得に失敗')) {
        status = 502;
      }
      
      return NextResponse.json(
        { error: result.error },
        { status }
      );
    }

    return NextResponse.json({
      dataUrl: result.dataUrl,
      contentType: result.contentType,
      size: result.size,
    });
  } catch (error) {
    logger.error('Error in fetch-image API route:', error);
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}



