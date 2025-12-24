import { NextRequest, NextResponse } from 'next/server';

/**
 * 許可するホスト名のリスト（SSRF対策）
 * next.config.ts の remotePatterns と同じ制限を適用
 */
const ALLOWED_HOSTNAMES = [
  'drive.google.com',
  'lh3.googleusercontent.com',
];

/**
 * プライベートIPアドレスかどうかを判定
 */
function isPrivateIP(hostname: string): boolean {
  // localhost
  if (hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '::1') {
    return true;
  }
  
  // プライベートIPv4範囲
  const privateIPv4Patterns = [
    /^10\./,
    /^172\.(1[6-9]|2[0-9]|3[01])\./,
    /^192\.168\./,
    /^169\.254\./, // リンクローカル
  ];
  
  return privateIPv4Patterns.some(pattern => pattern.test(hostname));
}

/**
 * URLが許可されているかをチェック
 */
function isAllowedUrl(url: string): { allowed: boolean; error?: string } {
  try {
    const urlObj = new URL(url);
    
    // HTTPSのみ許可
    if (urlObj.protocol !== 'https:') {
      return { allowed: false, error: 'HTTPSのみ許可されています' };
    }
    
    // プライベートIPを拒否
    if (isPrivateIP(urlObj.hostname)) {
      return { allowed: false, error: 'プライベートIPアドレスは許可されていません' };
    }
    
    // 許可リストのホスト名のみ許可
    const isHostAllowed = ALLOWED_HOSTNAMES.some(allowed => 
      urlObj.hostname === allowed || urlObj.hostname.endsWith('.' + allowed)
    );
    
    if (!isHostAllowed) {
      return { 
        allowed: false, 
        error: `許可されていないホストです。許可されているホスト: ${ALLOWED_HOSTNAMES.join(', ')}` 
      };
    }
    
    return { allowed: true };
  } catch {
    return { allowed: false, error: '無効なURL形式です' };
  }
}

export async function POST(request: NextRequest) {
  try {
    const { url } = await request.json();
    
    if (!url || typeof url !== 'string') {
      return NextResponse.json(
        { error: 'URLが必要です' },
        { status: 400 }
      );
    }

    // URL検証
    const validation = isAllowedUrl(url);
    if (!validation.allowed) {
      return NextResponse.json(
        { error: validation.error || '許可されていないURLです' },
        { status: 403 }
      );
    }

    // 画像取得（タイムアウト設定）
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10秒タイムアウト
    
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
        },
        signal: controller.signal,
      });
      
      clearTimeout(timeoutId);

      if (!response.ok) {
        return NextResponse.json(
          { error: `画像の取得に失敗しました: ${response.status} ${response.statusText}` },
          { status: response.status }
        );
      }

      // Content-Typeが画像であることを確認
      const contentType = response.headers.get('content-type');
      if (!contentType || !contentType.startsWith('image/')) {
        return NextResponse.json(
          { error: `画像ではありません (Content-Type: ${contentType})` },
          { status: 400 }
        );
      }

      // サイズ制限（10MB）
      const contentLength = response.headers.get('content-length');
      if (contentLength && parseInt(contentLength) > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '画像サイズが大きすぎます（上限10MB）' },
          { status: 413 }
        );
      }

      // Blobとして取得
      const blob = await response.blob();
      
      // 実際のサイズチェック
      if (blob.size > 10 * 1024 * 1024) {
        return NextResponse.json(
          { error: '画像サイズが大きすぎます（上限10MB）' },
          { status: 413 }
        );
      }
      
      const arrayBuffer = await blob.arrayBuffer();

      // Base64エンコードして返す
      const base64 = Buffer.from(arrayBuffer).toString('base64');
      const dataUrl = `data:${contentType};base64,${base64}`;

      return NextResponse.json({
        dataUrl,
        contentType,
        size: blob.size,
      });
    } finally {
      clearTimeout(timeoutId);
    }
  } catch (error) {
    console.error('Error fetching image:', error);
    
    if (error instanceof Error && error.name === 'AbortError') {
      return NextResponse.json(
        { error: '画像の取得がタイムアウトしました' },
        { status: 504 }
      );
    }
    
    return NextResponse.json(
      { error: error instanceof Error ? error.message : '不明なエラー' },
      { status: 500 }
    );
  }
}


