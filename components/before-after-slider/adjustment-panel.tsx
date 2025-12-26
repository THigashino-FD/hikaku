"use client"

import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import { Input } from "@/components/ui/input"

interface AdjustmentPanelProps {
  beforeScale: number
  afterScale: number
  beforeX: number
  beforeY: number
  afterX: number
  afterY: number
  onBeforeScaleChange: (value: number) => void
  onAfterScaleChange: (value: number) => void
  onBeforeXChange: (value: number) => void
  onBeforeYChange: (value: number) => void
  onAfterXChange: (value: number) => void
  onAfterYChange: (value: number) => void
  onReset: () => void
  onSave?: () => void
}

const clamp = (value: number, min: number, max: number) => Math.min(Math.max(value, min), max)
const parseNumber = (raw: string) => {
  const n = Number(raw)
  return Number.isFinite(n) ? n : null
}

export function AdjustmentPanel({
  beforeScale,
  afterScale,
  beforeX,
  beforeY,
  afterX,
  afterY,
  onBeforeScaleChange,
  onAfterScaleChange,
  onBeforeXChange,
  onBeforeYChange,
  onAfterXChange,
  onAfterYChange,
  onReset,
  onSave,
}: AdjustmentPanelProps) {
  return (
    <div className="space-y-6 rounded-xl border border-border bg-card p-4 sm:p-6 shadow-sm">
      <div className="grid gap-4 sm:gap-6 md:grid-cols-2">
        {/* Before Image Controls */}
        <div className="space-y-4">
          <h4 className="font-semibold text-foreground">改築前の画像調整</h4>

          <div className="space-y-2">
            <label className="text-sm font-medium text-foreground">拡大率: {beforeScale}%</label>
            <Slider
              value={[beforeScale]}
              onValueChange={(value) => onBeforeScaleChange(clamp(value[0], 50, 200))}
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
                  onBeforeScaleChange(clamp(Math.round(n), 50, 200))
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
              onValueChange={(value) => onBeforeXChange(clamp(value[0], -200, 200))}
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
                  onBeforeXChange(clamp(Math.round(n), -200, 200))
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
              onValueChange={(value) => onBeforeYChange(clamp(value[0], -200, 200))}
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
                  onBeforeYChange(clamp(Math.round(n), -200, 200))
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
              onValueChange={(value) => onAfterScaleChange(clamp(value[0], 50, 200))}
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
                  onAfterScaleChange(clamp(Math.round(n), 50, 200))
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
              onValueChange={(value) => onAfterXChange(clamp(value[0], -200, 200))}
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
                  onAfterXChange(clamp(Math.round(n), -200, 200))
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
              onValueChange={(value) => onAfterYChange(clamp(value[0], -200, 200))}
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
                  onAfterYChange(clamp(Math.round(n), -200, 200))
                }}
                className="h-8 w-24 bg-background"
                aria-label="改築後の垂直位置（px）"
              />
              <span className="text-xs text-muted-foreground">px</span>
            </div>
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex justify-center gap-3">
        <Button onClick={onReset} variant="outline" className="gap-2 bg-transparent">
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
        {onSave && (
          <Button onClick={onSave} className="gap-2">
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
  )
}

