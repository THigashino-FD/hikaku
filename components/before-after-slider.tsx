"use client"

import { useState, useRef, useEffect } from "react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

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
}

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
}: BeforeAfterSliderProps) {
  const [sliderPosition, setSliderPosition] = useState(50)
  const [isDragging, setIsDragging] = useState(false)
  const [beforeScale, setBeforeScale] = useState(defaultBeforeScale)
  const [afterScale, setAfterScale] = useState(defaultAfterScale)
  const [beforeX, setBeforeX] = useState(defaultBeforeX)
  const [beforeY, setBeforeY] = useState(defaultBeforeY)
  const [afterX, setAfterX] = useState(defaultAfterX)
  const [afterY, setAfterY] = useState(defaultAfterY)
  const [showControls, setShowControls] = useState(false)
  const [customBeforeUrl, setCustomBeforeUrl] = useState("")
  const [customAfterUrl, setCustomAfterUrl] = useState("")
  const containerRef = useRef<HTMLDivElement>(null)

  const displayBeforeImage = customBeforeUrl || beforeImage
  const displayAfterImage = customAfterUrl || afterImage

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return

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

  const resetImages = () => {
    setCustomBeforeUrl("")
    setCustomAfterUrl("")
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-end">
        <Button variant="outline" size="sm" onClick={() => setShowControls(!showControls)} className="gap-2">
          <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M12 6V4m0 2a2 2 0 100 4m0-4a2 2 0 110 4m-6 8a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4m6 6v10m6-2a2 2 0 100-4m0 4a2 2 0 110-4m0 4v2m0-6V4"
            />
          </svg>
          {showControls ? "調整パネルを閉じる" : "縮尺・位置を調整"}
        </Button>
      </div>

      {showControls && (
        <div className="space-y-6 rounded-lg border border-border bg-card p-6">
          <div className="space-y-4 rounded-lg border border-border/50 bg-muted/30 p-4">
            <h4 className="font-semibold text-foreground">画像のURL入力</h4>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">改築前の画像URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/before.jpg"
                  value={customBeforeUrl}
                  onChange={(e) => setCustomBeforeUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">改築後の画像URL</label>
                <Input
                  type="url"
                  placeholder="https://example.com/after.jpg"
                  value={customAfterUrl}
                  onChange={(e) => setCustomAfterUrl(e.target.value)}
                  className="bg-background"
                />
              </div>
            </div>
            {(customBeforeUrl || customAfterUrl) && (
              <div className="flex justify-center">
                <Button onClick={resetImages} variant="outline" size="sm" className="gap-2 bg-transparent">
                  <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                    />
                  </svg>
                  デフォルト画像に戻す
                </Button>
              </div>
            )}
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Before Image Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">改築前の画像調整</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">拡大率: {beforeScale}%</label>
                <Slider
                  value={[beforeScale]}
                  onValueChange={(value) => setBeforeScale(value[0])}
                  min={50}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">水平位置: {beforeX}px</label>
                <Slider
                  value={[beforeX]}
                  onValueChange={(value) => setBeforeX(value[0])}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">垂直位置: {beforeY}px</label>
                <Slider
                  value={[beforeY]}
                  onValueChange={(value) => setBeforeY(value[0])}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>

            {/* After Image Controls */}
            <div className="space-y-4">
              <h4 className="font-semibold text-foreground">改築後の画像調整</h4>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">拡大率: {afterScale}%</label>
                <Slider
                  value={[afterScale]}
                  onValueChange={(value) => setAfterScale(value[0])}
                  min={50}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">水平位置: {afterX}px</label>
                <Slider
                  value={[afterX]}
                  onValueChange={(value) => setAfterX(value[0])}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium text-foreground">垂直位置: {afterY}px</label>
                <Slider
                  value={[afterY]}
                  onValueChange={(value) => setAfterY(value[0])}
                  min={-200}
                  max={200}
                  step={1}
                  className="w-full"
                />
              </div>
            </div>
          </div>

          {/* Reset Button */}
          <div className="flex justify-center">
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
          </div>
        </div>
      )}

      <div
        ref={containerRef}
        className={cn("relative w-full overflow-hidden rounded-lg select-none", className)}
        style={{ aspectRatio: "16/9" }}
      >
        {/* Before Image (Bottom Layer) */}
        <div className="absolute inset-0">
          <img
            src={displayBeforeImage || "/placeholder.svg"}
            alt="Before"
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${beforeScale / 100}) translate(${beforeX}px, ${beforeY}px)`,
              transformOrigin: "center center",
            }}
            draggable={false}
          />
          <div className="absolute left-4 top-4 rounded-md bg-background/90 px-3 py-1.5 text-sm font-medium text-foreground backdrop-blur-sm">
            {beforeLabel}
          </div>
        </div>

        {/* After Image (Top Layer with Clip) */}
        <div className="absolute inset-0" style={{ clipPath: `inset(0 ${100 - sliderPosition}% 0 0)` }}>
          <img
            src={displayAfterImage || "/placeholder.svg"}
            alt="After"
            className="h-full w-full object-cover"
            style={{
              transform: `scale(${afterScale / 100}) translate(${afterX}px, ${afterY}px)`,
              transformOrigin: "center center",
            }}
            draggable={false}
          />
          <div className="absolute right-4 top-4 rounded-md bg-primary/90 px-3 py-1.5 text-sm font-medium text-primary-foreground backdrop-blur-sm">
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
          <div className="relative h-full w-0.5 bg-primary shadow-lg">
            {/* Handle Circle */}
            <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-primary shadow-xl">
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
    </div>
  )
}
