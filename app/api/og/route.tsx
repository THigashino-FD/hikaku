import { ImageResponse } from '@vercel/og'
import { NextRequest } from 'next/server'
import { logger, generateRequestId, withRequestContext, getCurrentMeta } from '@/lib/logger'
import { decodeSharedCase } from '@/lib/share'

// 注意: Cache Components有効時は revalidate を使用できない
// OG画像は頻繁に変わらないため、Next.jsのデフォルトキャッシュに依存
// 将来的にキャッシュ制御が必要な場合は next.config.ts で調整

export async function GET(request: NextRequest) {
  return withRequestContext(
    { requestId: generateRequestId() },
    async () => {
      const meta = getCurrentMeta()
      
      try {
        const { searchParams } = new URL(request.url)
        const shareData = searchParams.get('share')

        if (!shareData) {
          logger.log(meta, 'GET /api/og: default image')
          // デフォルトのOG画像を返す
          return new ImageResponse(
            (
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0b5560',
                  backgroundImage: 'linear-gradient(to bottom, #0b5560, #0a4a54)',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '20px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 80,
                      fontWeight: 'bold',
                      color: 'white',
                    }}
                  >
                    劇的ビフォー/アフターツール
                  </div>
                  <div
                    style={{
                      fontSize: 32,
                      color: '#a0d2d8',
                    }}
                  >
                    NEUTRAL COMPARE
                  </div>
                </div>
              </div>
            ),
            {
              width: 1200,
              height: 630,
            }
          )
        }

        // 共有データをデコード
        const decodeResult = decodeSharedCase(shareData)
        if (!decodeResult.success) {
          logger.error(meta, 'OG image generation: Invalid share data', {
            shareData: shareData.substring(0, 50), // 最初の50文字だけログ
            error: decodeResult.error,
          })
          
          // エラー時はフォールバック画像を返す
          return new ImageResponse(
            (
              <div
                style={{
                  height: '100%',
                  width: '100%',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  backgroundColor: '#0b5560',
                }}
              >
                <div
                  style={{
                    fontSize: 48,
                    color: 'white',
                  }}
                >
                  劇的ビフォー/アフターツール
                </div>
              </div>
            ),
            {
              width: 1200,
              height: 630,
            }
          )
        }

        const decoded = decodeResult.data
        logger.log(meta, 'GET /api/og: custom image', { title: decoded.title })

        // Before/After画像を取得して合成
        // 注意: Edge Runtimeではfetchが制限されるため、外部画像の直接取得は難しい
        // ここでは、テキストベースのOG画像を生成
        const title = decoded.title || 'Before/After比較'
        const description = decoded.description || ''

        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                backgroundColor: '#0b5560',
                backgroundImage: 'linear-gradient(to bottom, #0b5560, #0a4a54)',
              }}
            >
              {/* ヘッダー */}
              <div
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  paddingTop: '60px',
                  paddingBottom: '40px',
                }}
              >
                <div
                  style={{
                    fontSize: 64,
                    fontWeight: 'bold',
                    color: 'white',
                    marginBottom: '20px',
                    textAlign: 'center',
                    maxWidth: '1000px',
                  }}
                >
                  {title}
                </div>
                {description && (
                  <div
                    style={{
                      fontSize: 28,
                      color: '#a0d2d8',
                      textAlign: 'center',
                      maxWidth: '1000px',
                    }}
                  >
                    {description}
                  </div>
                )}
              </div>

              {/* Before/Afterラベル */}
              <div
                style={{
                  display: 'flex',
                  width: '100%',
                  justifyContent: 'space-around',
                  marginTop: 'auto',
                  paddingBottom: '60px',
                }}
              >
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '20px 40px',
                      borderRadius: '12px',
                    }}
                  >
                    Before
                  </div>
                </div>
                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '16px',
                  }}
                >
                  <div
                    style={{
                      fontSize: 48,
                      fontWeight: 'bold',
                      color: 'white',
                      backgroundColor: 'rgba(255, 255, 255, 0.1)',
                      padding: '20px 40px',
                      borderRadius: '12px',
                    }}
                  >
                    After
                  </div>
                </div>
              </div>

              {/* フッター */}
              <div
                style={{
                  position: 'absolute',
                  bottom: '20px',
                  right: '40px',
                  fontSize: 24,
                  color: '#a0d2d8',
                }}
              >
                NEUTRAL COMPARE
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        )
      } catch (error) {
        logger.error(meta, 'Error generating OG image:', error)
        
        // エラー時のフォールバック画像
        return new ImageResponse(
          (
            <div
              style={{
                height: '100%',
                width: '100%',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                backgroundColor: '#0b5560',
              }}
            >
              <div
                style={{
                  fontSize: 48,
                  color: 'white',
                }}
              >
                劇的ビフォー/アフターツール
              </div>
            </div>
          ),
          {
            width: 1200,
            height: 630,
          }
        )
      }
    }
  )
}

