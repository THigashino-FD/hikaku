"use client"

import { useState, useRef, useEffect, useCallback } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { SafeImage } from "@/components/safe-image"
import { useToast } from "@/components/ui/toast"
import { AdjustmentPanel } from "./adjustment-panel"
import { useRevealAnimation } from "./hooks/use-reveal-animation"

interface BeforeAfterSliderProps {
  beforeImage: string
  afterImage: string
  beforeLabel?: string
  afterLabel?: string
  className?: string
  defaultBeforeScale?: number
  defaultAfterScale?: number
  defaultBeforeX?: number
  defaultBeforeY?: number
  defaultAfterX?: number
  defaultAfterY?: number
  initialSliderPosition?: number // 初期スライダー位置（0-100%）
  animationType?: 'none' | 'demo' // アニメーション種別
  initialComparisonMode?: ComparisonMode // 比較モードの初期値
  onSaveViewSettings?: (
    beforeSettings: { scale: number; x: number; y: number },
    afterSettings: { scale: number; x: number; y: number }
  ) => void
  onImageError?: (side: 'before' | 'after') => void // 画像読み込みエラー時のコールバック
}

type ComparisonMode = "slider" | "sideBySide"

export function BeforeAfterSlider({
  beforeImage,
  afterImage,
  beforeLabel = "Before",
  afterLabel = "After",
  className,
  defaultBeforeScale = 100,
  defaultAfterScale = 100,
  defaultBeforeX = 0,
  defaultBeforeY = 0,
  defaultAfterX = 0,
  defaultAfterY = 0,
  initialSliderPosition = 50,
  animationType = 'none',
  initialComparisonMode = "slider",
  onSaveViewSettings,
  onImageError,
}: BeforeAfterSliderProps) {
  const { showToast } = useToast()
  const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
  const parseNumber = (raw: string) => {
    const n = Number(raw)
    return Number.isFinite(n) ? n : null
  }

  const [sliderPosition, setSliderPosition] = useState(initialSliderPosition)
  const [isDragging, setIsDragging] = useState(false)
  const [beforeScale, setBeforeScale] = useState(defaultBeforeScale)
  const [afterScale, setAfterScale] = useState(defaultAfterScale)
  const [beforeX, setBeforeX] = useState(defaultBeforeX)
  const [beforeY, setBeforeY] = useState(defaultBeforeY)
  const [afterX, setAfterX] = useState(defaultAfterX)
  const [afterY, setAfterY] = useState(defaultAfterY)
  const [isFullscreen, setIsFullscreen] = useState(false)
  const [comparisonMode, setComparisonMode] = useState<ComparisonMode>(initialComparisonMode)
  const [beforeImageLoaded, setBeforeImageLoaded] = useState(false)
  const [afterImageLoaded, setAfterImageLoaded] = useState(false)
  const [panelMode, setPanelMode] = useState<"none" | "adjust">("none")
  
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)

  const displayBeforeImage = beforeImage
  const displayAfterImage = afterImage

  // 画像のkey用に安全なIDを生成
  // URLが変わったらkeyも変わるようにする（ハッシュ的な処理）
  const getImageKey = (url: string | undefined, prefix: string) => {
    if (!url) return `${prefix}-empty`
    // URL全体をエンコードして一意性を確保（長さ制限付き）
    const hash = Array.from(url).reduce((acc, char) => {
      return ((acc << 5) - acc + char.charCodeAt(0)) | 0
    }, 0)
    return `${prefix}-${Math.abs(hash)}`
  }
  
  const beforeImageKey = getImageKey(displayBeforeImage, 'before')
  const afterImageKey = getImageKey(displayAfterImage, 'after')

  // 画像URLが変わったら読み込み状態をリセット
  /* eslint-disable react-hooks/set-state-in-effect -- URL変更時のUI状態リセット（表示用stateの同期） */
  useEffect(() => {
    setBeforeImageLoaded(false)
    setAfterImageLoaded(false)
  }, [displayBeforeImage, displayAfterImage, beforeImageKey, afterImageKey])
  /* eslint-enable react-hooks/set-state-in-effect */

  // アニメーションロジックをカスタムフックに委譲
  const { animationCancelled, cancelAnimation } = useRevealAnimation({
    animationType,
    initialSliderPosition,
    beforeImageLoaded,
    afterImageLoaded,
    onPositionChange: setSliderPosition,
  })

  // フルスクリーン切り替え
  const toggleFullscreen = () => {
    if (!isFullscreen) {
      if (fullscreenRef.current?.requestFullscreen) {
        fullscreenRef.current.requestFullscreen()
      }
      setIsFullscreen(true)
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen()
      }
      setIsFullscreen(false)
    }
  }

  // フルスクリーン終了イベントのリスナー
  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement)
    }

    document.addEventListener('fullscreenchange', handleFullscreenChange)
    return () => {
      document.removeEventListener('fullscreenchange', handleFullscreenChange)
    }
  }, [])

  const handleMove = useCallback((clientX: number) => {
    if (!containerRef.current) return

    // アニメーション中の場合は中断
    if (!animationCancelled && animationType === 'demo') {
      cancelAnimation()
    }

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100

    setSliderPosition(Math.min(Math.max(percentage, 0), 100))
  }, [animationCancelled, animationType, cancelAnimation])

  // キーボードショートカット
  const handleKeyDown = useCallback((e: React.KeyboardEvent) => {
    // アニメーション中の場合は中断
    if (!animationCancelled && animationType === 'demo') {
      cancelAnimation()
    }

    switch (e.key) {
      case 'ArrowLeft':
        e.preventDefault()
        if (e.shiftKey) {
          // Shift + 左矢印: 1%ずつ移動
          setSliderPosition(prev => Math.max(prev - 1, 0))
        } else {
          // 左矢印: 5%ずつ移動
          setSliderPosition(prev => Math.max(prev - 5, 0))
        }
        break
      case 'ArrowRight':
        e.preventDefault()
        if (e.shiftKey) {
          // Shift + 右矢印: 1%ずつ移動
          setSliderPosition(prev => Math.min(prev + 1, 100))
        } else {
          // 右矢印: 5%ずつ移動
          setSliderPosition(prev => Math.min(prev + 5, 100))
        }
        break
      case ' ':
      case 'Spacebar':
        e.preventDefault()
        // Spaceキー: 中央位置（50%）にリセット
        setSliderPosition(50)
        break
    }
  }, [animationCancelled, animationType, cancelAnimation])

  const handleStart = useCallback(() => {
    // アニメーション中の場合は中断
    if (!animationCancelled && animationType === 'demo') {
      cancelAnimation()
    }
    setIsDragging(true)
  }, [animationCancelled, animationType, cancelAnimation])

  const handleEnd = useCallback(() => {
    setIsDragging(false)
  }, [])

  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => {
      handleMove(e.clientX)
    }

    const onTouchMove = (e: TouchEvent) => {
      if (e.touches[0]) {
        handleMove(e.touches[0].clientX)
      }
    }

    window.addEventListener("mousemove", onMouseMove)
    window.addEventListener("mouseup", handleEnd)
    window.addEventListener("touchmove", onTouchMove)
    window.addEventListener("touchend", handleEnd)

    return () => {
      window.removeEventListener("mousemove", onMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", onTouchMove)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging, handleMove, handleEnd])

  const resetAdjustments = () => {
    setBeforeScale(defaultBeforeScale)
    setAfterScale(defaultAfterScale)
    setBeforeX(defaultBeforeX)
    setBeforeY(defaultBeforeY)
    setAfterX(defaultAfterX)
    setAfterY(defaultAfterY)
  }

  const handleSaveViewSettings = () => {
    if (onSaveViewSettings) {
      onSaveViewSettings(
        { scale: beforeScale, x: beforeX, y: beforeY },
        { scale: afterScale, x: afterX, y: afterY }
      )
      showToast("初期表示設定として保存しました", "success")
    }
  }

  return (
    <div ref={fullscreenRef} className={cn("space-y-4 max-w-full", isFullscreen && "fixed inset-0 z-50 bg-background p-6 overflow-auto")}>
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-wrap gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setPanelMode(panelMode === "adjust" ? "none" : "adjust")}
            className="gap-2 bg-transparent"
            aria-label={panelMode === "adjust" ? "調整を閉じる" : "調整"}
            aria-pressed={panelMode === "adjust"}
          >
            <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
              />
            </svg>
            <span className="hidden sm:inline">{panelMode === "adjust" ? "調整を閉じる" : "調整"}</span>
            <span className="sm:hidden">調整</span>
          </Button>

          {/* 比較モード切替 */}
          <div className="flex gap-1 rounded-md border bg-background p-1">
            <Button
              variant={comparisonMode === "slider" ? "default" : "ghost"}
              size="sm"
              onClick={() => setComparisonMode("slider")}
              className="h-7 gap-1.5 px-2"
              aria-label="スライダー"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16M8 8l-4 4 4 4m8-8l4 4-4 4" />
              </svg>
              <span className="hidden sm:inline">スライダー</span>
            </Button>

            <Button
              variant={comparisonMode === "sideBySide" ? "default" : "ghost"}
              size="sm"
              onClick={() => setComparisonMode("sideBySide")}
              className="h-7 gap-1.5 px-2"
              aria-label="左右比較"
            >
              <svg className="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <rect x="3" y="5" width="8" height="14" rx="1" strokeWidth={2} />
                <rect x="13" y="5" width="8" height="14" rx="1" strokeWidth={2} />
              </svg>
              <span className="hidden sm:inline">左右比較</span>
            </Button>
          </div>
        </div>

        {/* フルスクリーンボタン */}
        <Button variant="outline" size="sm" onClick={toggleFullscreen} className="gap-2 bg-transparent w-full sm:w-auto">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            {isFullscreen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 8V4m0 0h4M4 4l5 5m11-1V4m0 0h-4m4 0l-5 5M4 16v4m0 0h4m-4 0l5-5m11 5l-5-5m5 5v-4m0 4h-4" />
            )}
          </svg>
          {isFullscreen ? "終了" : "全画面"}
        </Button>
      </div>

      {panelMode === "adjust" && (
        <AdjustmentPanel
          beforeScale={beforeScale}
          afterScale={afterScale}
          beforeX={beforeX}
          beforeY={beforeY}
          afterX={afterX}
          afterY={afterY}
          onBeforeScaleChange={setBeforeScale}
          onAfterScaleChange={setAfterScale}
          onBeforeXChange={setBeforeX}
          onBeforeYChange={setBeforeY}
          onAfterXChange={setAfterX}
          onAfterYChange={setAfterY}
          onReset={resetAdjustments}
          onSave={handleSaveViewSettings}
        />
      )}

      {/* Comparison Container */}
      {comparisonMode === "slider" ? (
        <div
          ref={containerRef}
          className={cn("relative w-full overflow-hidden rounded-xl select-none", className)}
          style={{ aspectRatio: "16/9" }}
          onClick={() => {
            // クリックでアニメーション中断
            if (!animationCancelled && animationType === 'demo') {
              cancelAnimation()
            }
          }}
        >
          {/* Before Image (Bottom Layer) with loading placeholder */}
          <div className="absolute inset-0">
            {!beforeImageLoaded && (
              <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm font-medium text-muted-foreground">
                  {beforeLabel} を読み込み中...
                </div>
              </div>
            )}
            <SafeImage
              key={beforeImageKey}
              src={displayBeforeImage || "/placeholder.svg"}
              alt={beforeLabel}
              fill
              className={cn("object-cover transition-opacity duration-300", !beforeImageLoaded && "opacity-0")}
              style={{
                transform: `translate(${beforeX}px, ${beforeY}px) scale(${beforeScale / 100})`,
                transformOrigin: "center center",
              }}
              draggable={false}
              onLoad={() => setBeforeImageLoaded(true)}
              onError={() => {
                if (onImageError) {
                  onImageError('before')
                }
              }}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute left-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm md:text-sm">
              {beforeLabel}
            </div>
          </div>

          {/* After Image (Top Layer with Clip) with loading placeholder */}
          <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
            {!afterImageLoaded && (
              <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm font-medium text-muted-foreground">
                  {afterLabel} を読み込み中...
                </div>
              </div>
            )}
            <SafeImage
              key={afterImageKey}
              src={displayAfterImage || "/placeholder.svg"}
              alt={afterLabel}
              fill
              className={cn("object-cover transition-opacity duration-300", !afterImageLoaded && "opacity-0")}
              style={{
                transform: `translate(${afterX}px, ${afterY}px) scale(${afterScale / 100})`,
                transformOrigin: "center center",
              }}
              draggable={false}
              onLoad={() => setAfterImageLoaded(true)}
              onError={() => {
                if (onImageError) {
                  onImageError('after')
                }
              }}
              priority
              sizes="(max-width: 768px) 100vw, (max-width: 1200px) 80vw, 70vw"
            />
            <div className="absolute right-4 top-4 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-sm md:text-sm">
              {afterLabel}
            </div>
          </div>

          {/* Slider Handle */}
          <div
            className="absolute inset-y-0 flex cursor-ew-resize items-center"
            style={{ left: `${sliderPosition}%` }}
            onMouseDown={handleStart}
            onTouchStart={handleStart}
            onKeyDown={handleKeyDown}
            role="slider"
            aria-label="Before/After比較スライダー"
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(sliderPosition)}
            aria-valuetext={`${Math.round(sliderPosition)}%`}
            tabIndex={0}
          >
            {/* Vertical Line */}
            <div className="relative h-full w-0.5 bg-primary/80 shadow-md">
              {/* Handle Circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-black/5">
                  <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <svg
                    className="h-6 w-6 text-primary-foreground -ml-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                    aria-hidden="true"
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : (
        /* Side by Side Mode */
        <div className={cn("grid grid-cols-2 gap-4", className)}>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            {!beforeImageLoaded && (
              <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm font-medium text-muted-foreground">
                  {beforeLabel} を読み込み中...
                </div>
              </div>
            )}
            <SafeImage
              key={`${beforeImageKey}-side`}
              src={displayBeforeImage || "/placeholder.svg"}
              alt={beforeLabel}
              fill
              className={cn("object-cover transition-opacity duration-300", !beforeImageLoaded && "opacity-0")}
              style={{
                transform: `translate(${beforeX}px, ${beforeY}px) scale(${beforeScale / 100})`,
                transformOrigin: "center center",
              }}
              draggable={false}
              onLoad={() => setBeforeImageLoaded(true)}
              onError={() => {
                if (onImageError) {
                  onImageError('before')
                }
              }}
              priority
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 40vw, 35vw"
            />
            <div className="absolute left-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm md:text-sm">
              {beforeLabel}
            </div>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            {!afterImageLoaded && (
              <div className="absolute inset-0 bg-muted flex flex-col items-center justify-center gap-3">
                <svg className="h-8 w-8 animate-spin text-primary" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <div className="text-sm font-medium text-muted-foreground">
                  {afterLabel} を読み込み中...
                </div>
              </div>
            )}
            <SafeImage
              key={`${afterImageKey}-side`}
              src={displayAfterImage || "/placeholder.svg"}
              alt={afterLabel}
              fill
              className={cn("object-cover transition-opacity duration-300", !afterImageLoaded && "opacity-0")}
              style={{
                transform: `translate(${afterX}px, ${afterY}px) scale(${afterScale / 100})`,
                transformOrigin: "center center",
              }}
              draggable={false}
              onLoad={() => setAfterImageLoaded(true)}
              onError={() => {
                if (onImageError) {
                  onImageError('after')
                }
              }}
              priority
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 40vw, 35vw"
            />
            <div className="absolute right-4 top-4 rounded-full bg-primary/90 px-3 py-1.5 text-xs font-medium text-primary-foreground backdrop-blur-sm md:text-sm">
              {afterLabel}
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
