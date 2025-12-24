/**
 * 安全な画像表示コンポーネント
 * 
 * - blob URL: next/image で最適化
 * - 外部URL: <img> タグで直接表示（サーバーサイドフェッチを回避）
 */

import Image from "next/image"
import { cn } from "@/lib/utils"

interface SafeImageProps {
  src: string
  alt: string
  className?: string
  fill?: boolean
  width?: number
  height?: number
  priority?: boolean
  sizes?: string
  style?: React.CSSProperties
  draggable?: boolean
  onLoad?: () => void
  onError?: () => void
}

/**
 * URLがblob URLかどうかを判定
 */
function isBlobUrl(url: string): boolean {
  return url.startsWith('blob:') || url.startsWith('data:')
}

/**
 * URLがローカル（public内）のパスかどうかを判定
 */
function isLocalPath(url: string): boolean {
  return url.startsWith('/') && !url.startsWith('//')
}

export function SafeImage({
  src,
  alt,
  className,
  fill,
  width,
  height,
  priority,
  sizes,
  style,
  draggable = false,
  onLoad,
  onError,
}: SafeImageProps) {
  // blob URL または ローカルパスの場合は next/image を使用
  if (isBlobUrl(src) || isLocalPath(src)) {
    return (
      <Image
        src={src}
        alt={alt}
        fill={fill}
        width={width}
        height={height}
        className={className}
        priority={priority}
        sizes={sizes}
        style={style}
        draggable={draggable}
        onLoad={onLoad}
        onError={onError}
      />
    )
  }

  // 外部URLの場合は <img> タグを使用（サーバーサイドフェッチを回避）
  if (fill) {
    return (
      <img
        src={src}
        alt={alt}
        className={cn("object-cover", className)}
        style={{
          ...style,
          position: 'absolute',
          height: '100%',
          width: '100%',
          inset: 0,
        }}
        draggable={draggable}
        onLoad={onLoad}
        onError={onError}
      />
    )
  }

  return (
    <img
      src={src}
      alt={alt}
      width={width}
      height={height}
      className={className}
      style={style}
      draggable={draggable}
      onLoad={onLoad}
      onError={onError}
    />
  )
}

