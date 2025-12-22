"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"
import Image from "next/image"
import { useToast } from "@/components/ui/toast"

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
  const [isAnimating, setIsAnimating] = useState(false)
  const [animationCancelled, setAnimationCancelled] = useState(false)
  const [panelMode, setPanelMode] = useState<"none" | "adjust">("none")
  
  const containerRef = useRef<HTMLDivElement>(null)
  const fullscreenRef = useRef<HTMLDivElement>(null)
  const animationFrameRef = useRef<number | null>(null)
  const isAnimatingRef = useRef(false) // ロジック制御用のRef

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
    setAnimationCancelled(false)
  }, [displayBeforeImage, displayAfterImage, beforeImageKey, afterImageKey])
  /* eslint-enable react-hooks/set-state-in-effect */

  // アニメーションをキャンセルする関数
  const cancelAnimation = () => {
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current)
      animationFrameRef.current = null
    }
    isAnimatingRef.current = false
    setIsAnimating(false)
    setAnimationCancelled(true)
  }

  // 初期表示アニメーション（自動リベール）
  // 目的: 「スライダーを動かすと Before/After を理解できる」ことを、1回のデモで伝える
  // 方針: 初期位置→(After側を見せる)→初期位置→(Before側を見せる)→初期位置（途中で少し止める）
  useEffect(() => {
    // animationTypeが'demo'以外の場合はアニメーションを実行しない
    if (animationType !== 'demo') {
      return
    }

    // 既にキャンセルされているか、既に実行中の場合は何もしない
    if (animationCancelled || isAnimatingRef.current) {
      return
    }

    // OS設定で「視差効果を減らす」を尊重
    const prefersReducedMotion =
      typeof window !== "undefined" &&
      window.matchMedia?.("(prefers-reduced-motion: reduce)")?.matches
    if (prefersReducedMotion) {
      return
    }

    let startTime: number | null = null

    // 初期位置を基準に、左右に18%ずつ動く
    const basePos = initialSliderPosition
    const rightPos = Math.min(basePos + 18, 100)
    const leftPos = Math.max(basePos - 18, 0)

    // タイムライン（ms）: "止まる"を挟んで、Before/Afterが切り替わることを認知しやすくする
    const keyframes: Array<{ t: number; pos: number }> = [
      { t: 0, pos: basePos },
      { t: 200, pos: basePos },
      { t: 800, pos: rightPos },
      { t: 1000, pos: rightPos },
      { t: 1600, pos: leftPos },
      { t: 1800, pos: leftPos },
      { t: 2400, pos: basePos },
    ]
    const totalDuration = keyframes[keyframes.length - 1]!.t

    const easeInOutSine = (t: number) => -(Math.cos(Math.PI * t) - 1) / 2

    const positionAt = (elapsed: number) => {
      if (elapsed <= 0) return keyframes[0]!.pos
      if (elapsed >= totalDuration) return keyframes[keyframes.length - 1]!.pos

      for (let i = 0; i < keyframes.length - 1; i++) {
        const a = keyframes[i]!
        const b = keyframes[i + 1]!
        if (elapsed >= a.t && elapsed <= b.t) {
          if (a.pos === b.pos || b.t === a.t) return a.pos
          const raw = (elapsed - a.t) / (b.t - a.t)
          const eased = easeInOutSine(raw)
          return a.pos + (b.pos - a.pos) * eased
        }
      }
      return basePos
    }

    const animate = (timestamp: number) => {
      if (!startTime) startTime = timestamp
      const elapsed = timestamp - startTime
      const pos = positionAt(elapsed)
      setSliderPosition(pos)

      if (elapsed < totalDuration && isAnimatingRef.current) {
        animationFrameRef.current = requestAnimationFrame(animate)
      } else {
        setSliderPosition(basePos)
        isAnimatingRef.current = false
        setIsAnimating(false)
      }
    }

    // 画像が両方読み込まれてからアニメーション開始
    if (beforeImageLoaded && afterImageLoaded) {
      isAnimatingRef.current = true
      // eslint-disable-next-line react-hooks/set-state-in-effect -- アニメーション開始をUIに反映
      setIsAnimating(true)
      animationFrameRef.current = requestAnimationFrame(animate)
    }

    return () => {
      // ここでのクリーンアップは「本当にアンマウントされた時」または「画像URLが変わった時」に限定される
      // ただし、depsからisAnimatingを外したことで、setIsAnimatingによる再実行は起きない
      if (animationFrameRef.current) {
        cancelAnimationFrame(animationFrameRef.current)
      }
    }
  }, [beforeImageLoaded, afterImageLoaded, animationType, animationCancelled, initialSliderPosition]) // animationTypeとinitialSliderPositionを追加

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

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return

    // アニメーション中の場合は中断
    if (isAnimating) {
      cancelAnimation()
    }

    const rect = containerRef.current.getBoundingClientRect()
    const x = clientX - rect.left
    const percentage = (x / rect.width) * 100

    setSliderPosition(Math.min(Math.max(percentage, 0), 100))
  }

  const handleMouseMove = (e: MouseEvent) => {
    if (isDragging) {
      handleMove(e.clientX)
    }
  }

  const handleTouchMove = (e: TouchEvent) => {
    if (isDragging && e.touches[0]) {
      handleMove(e.touches[0].clientX)
    }
  }

  const handleStart = () => {
    // アニメーション中の場合は中断
    if (isAnimating) {
      cancelAnimation()
    }
    setIsDragging(true)
  }

  const handleEnd = () => {
    setIsDragging(false)
  }

  useEffect(() => {
    if (isDragging) {
      window.addEventListener("mousemove", handleMouseMove)
      window.addEventListener("mouseup", handleEnd)
      window.addEventListener("touchmove", handleTouchMove)
      window.addEventListener("touchend", handleEnd)
    }

    return () => {
      window.removeEventListener("mousemove", handleMouseMove)
      window.removeEventListener("mouseup", handleEnd)
      window.removeEventListener("touchmove", handleTouchMove)
      window.removeEventListener("touchend", handleEnd)
    }
  }, [isDragging])

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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7h12M8 12h12M8 17h12M4 7h.01M4 12h.01M4 17h.01" />
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
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 4v16M9 4l-6 6m6-6l6 6" />
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

      {panelMode !== "none" && (
        <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
          {panelMode === "adjust" && (
            <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
            {/* Before Image Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">改築前の画像調整</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">拡大率: {beforeScale}%</label>
                <Slider
                  value={[beforeScale]}
                  onValueChange={(value) => setBeforeScale(clamp(value[0], 50, 200))}
                  min={50}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={50}
                    max={200}
                    step={1}
                    value={beforeScale}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setBeforeScale(clamp(Math.round(n), 50, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築前の拡大率（%）"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">水平位置: {beforeX}px</label>
                <Slider
                  value={[beforeX]}
                  onValueChange={(value) => setBeforeX(clamp(value[0], -200, 200))}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={-200}
                    max={200}
                    step={1}
                    value={beforeX}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setBeforeX(clamp(Math.round(n), -200, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築前の水平位置（px）"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">垂直位置: {beforeY}px</label>
                <Slider
                  value={[beforeY]}
                  onValueChange={(value) => setBeforeY(clamp(value[0], -200, 200))}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={-200}
                    max={200}
                    step={1}
                    value={beforeY}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setBeforeY(clamp(Math.round(n), -200, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築前の垂直位置（px）"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>

            {/* After Image Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">改築後の画像調整</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">拡大率: {afterScale}%</label>
                <Slider
                  value={[afterScale]}
                  onValueChange={(value) => setAfterScale(clamp(value[0], 50, 200))}
                  min={50}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={50}
                    max={200}
                    step={1}
                    value={afterScale}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setAfterScale(clamp(Math.round(n), 50, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築後の拡大率（%）"
                  />
                  <span className="text-xs text-muted-foreground">%</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">水平位置: {afterX}px</label>
                <Slider
                  value={[afterX]}
                  onValueChange={(value) => setAfterX(clamp(value[0], -200, 200))}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={-200}
                    max={200}
                    step={1}
                    value={afterX}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setAfterX(clamp(Math.round(n), -200, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築後の水平位置（px）"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">垂直位置: {afterY}px</label>
                <Slider
                  value={[afterY]}
                  onValueChange={(value) => setAfterY(clamp(value[0], -200, 200))}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
                <div className="flex items-center gap-2">
                  <Input
                    type="number"
                    inputMode="numeric"
                    min={-200}
                    max={200}
                    step={1}
                    value={afterY}
                    onChange={(e) => {
                      const n = parseNumber(e.target.value)
                      if (n === null) return
                      setAfterY(clamp(Math.round(n), -200, 200))
                    }}
                    className="h-8 w-24 bg-background"
                    aria-label="改築後の垂直位置（px）"
                  />
                  <span className="text-xs text-muted-foreground">px</span>
                </div>
              </div>
            </div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="flex justify-center gap-3">
            <Button onClick={resetAdjustments} variant="outline" className="gap-2 bg-transparent">
              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              位置・縮尺をリセット
            </Button>
            {onSaveViewSettings && (
              <Button onClick={handleSaveViewSettings} className="gap-2">
                <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4"
                  />
                </svg>
                この設定を初期表示として保存
              </Button>
            )}
          </div>
        </div>
      )}

      {/* Comparison Container */}
      {comparisonMode === "slider" ? (
        <div
          ref={containerRef}
          className={cn("relative w-full overflow-hidden rounded-xl select-none", className)}
          style={{ aspectRatio: "16/9" }}
          onClick={() => {
            // クリックでアニメーション中断
            if (isAnimating) {
              cancelAnimation()
            }
          }}
        >
          {/* Before Image (Bottom Layer) with loading placeholder */}
          <div className="absolute inset-0">
            {!beforeImageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <Image
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
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <Image
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
          >
            {/* Vertical Line */}
            <div className="relative h-full w-0.5 bg-primary/80 shadow-md">
              {/* Handle Circle */}
              <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
                <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-lg ring-1 ring-black/5">
                  <svg className="h-6 w-6 text-primary-foreground" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                  </svg>
                  <svg
                    className="h-6 w-6 text-primary-foreground -ml-3"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
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
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <Image
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
              priority
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 40vw, 35vw"
            />
            <div className="absolute left-4 top-4 rounded-full border border-border bg-background/80 px-3 py-1.5 text-xs font-medium text-foreground backdrop-blur-sm md:text-sm">
              {beforeLabel}
            </div>
          </div>
          <div className="relative w-full overflow-hidden rounded-xl" style={{ aspectRatio: "16/9" }}>
            {!afterImageLoaded && (
              <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                <svg className="h-12 w-12 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
            <Image
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
