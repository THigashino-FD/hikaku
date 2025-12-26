"use client"

import { Slider } from "@/components/ui/slider"
import type { CaseRecord } from "@/lib/db"

interface InitialSettingsSectionProps {
  initialSliderPosition: number
  animationType: 'none' | 'demo'
  viewBefore: { scale: number; x: number; y: number }
  viewAfter: { scale: number; x: number; y: number }
  caseId: string
  onSliderPositionChange: (position: number) => void
  onAnimationTypeChange: (type: 'none' | 'demo') => void
  onViewChange: (side: "before" | "after", field: "scale" | "x" | "y", value: number) => void
}

export function InitialSettingsSection({
  initialSliderPosition,
  animationType,
  viewBefore,
  viewAfter,
  caseId,
  onSliderPositionChange,
  onAnimationTypeChange,
  onViewChange,
}: InitialSettingsSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">初期表示設定</h2>
      <p className="text-sm text-muted-foreground">
        閲覧ページで最初に表示される際のスライダー位置・ズーム・位置・アニメーションを設定します
      </p>

      {/* 初期スライダー位置 */}
      <div className="space-y-4 rounded border bg-muted/30 p-4">
        <h3 className="font-semibold">初期スライダー位置</h3>
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium">
              スライダー位置: {initialSliderPosition}%
            </label>
            <span className="text-xs text-muted-foreground">
              {initialSliderPosition < 30 && "Before中心"}
              {initialSliderPosition >= 30 && initialSliderPosition < 70 && "バランス"}
              {initialSliderPosition >= 70 && "After中心"}
            </span>
          </div>
          <Slider
            value={[initialSliderPosition]}
            onValueChange={(value) => onSliderPositionChange(value[0])}
            min={0}
            max={100}
            step={1}
          />
          <p className="text-xs text-muted-foreground">
            左(0%)はBefore全表示、右(100%)はAfter全表示、中央(50%)は均等表示
          </p>
        </div>
      </div>

      {/* アニメーション設定 */}
      <div className="space-y-4 rounded border bg-muted/30 p-4">
        <h3 className="font-semibold">アニメーション</h3>
        <div className="space-y-3">
          <div className="flex gap-3">
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded border bg-background p-3 transition-colors hover:bg-muted">
              <input
                type="radio"
                name={`animation-${caseId}`}
                value="none"
                checked={animationType === 'none'}
                onChange={(e) =>
                  onAnimationTypeChange(e.target.value as 'none' | 'demo')
                }
                className="h-4 w-4"
              />
              <div>
                <div className="font-medium">なし</div>
                <div className="text-xs text-muted-foreground">
                  初期位置で静止表示
                </div>
              </div>
            </label>
            <label className="flex flex-1 cursor-pointer items-center gap-3 rounded border bg-background p-3 transition-colors hover:bg-muted">
              <input
                type="radio"
                name={`animation-${caseId}`}
                value="demo"
                checked={animationType === 'demo'}
                onChange={(e) =>
                  onAnimationTypeChange(e.target.value as 'none' | 'demo')
                }
                className="h-4 w-4"
              />
              <div>
                <div className="font-medium">デモ</div>
                <div className="text-xs text-muted-foreground">
                  自動でBefore/Afterを見せる
                </div>
              </div>
            </label>
          </div>
          <p className="text-xs text-muted-foreground">
            デモアニメーションは、初期位置を基準に左右へ動きます（約4秒）
          </p>
        </div>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Before Settings */}
        <div className="space-y-4 rounded border p-4">
          <h3 className="font-semibold">改築前（Before）</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              拡大率: {viewBefore.scale}%
            </label>
            <Slider
              value={[viewBefore.scale]}
              onValueChange={(value) =>
                onViewChange("before", "scale", value[0])
              }
              min={50}
              max={200}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              水平位置: {viewBefore.x}px
            </label>
            <Slider
              value={[viewBefore.x]}
              onValueChange={(value) =>
                onViewChange("before", "x", value[0])
              }
              min={-200}
              max={200}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              垂直位置: {viewBefore.y}px
            </label>
            <Slider
              value={[viewBefore.y]}
              onValueChange={(value) =>
                onViewChange("before", "y", value[0])
              }
              min={-200}
              max={200}
              step={1}
            />
          </div>
        </div>

        {/* After Settings */}
        <div className="space-y-4 rounded border p-4">
          <h3 className="font-semibold">改築後（After）</h3>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              拡大率: {viewAfter.scale}%
            </label>
            <Slider
              value={[viewAfter.scale]}
              onValueChange={(value) =>
                onViewChange("after", "scale", value[0])
              }
              min={50}
              max={200}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              水平位置: {viewAfter.x}px
            </label>
            <Slider
              value={[viewAfter.x]}
              onValueChange={(value) =>
                onViewChange("after", "x", value[0])
              }
              min={-200}
              max={200}
              step={1}
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">
              垂直位置: {viewAfter.y}px
            </label>
            <Slider
              value={[viewAfter.y]}
              onValueChange={(value) =>
                onViewChange("after", "y", value[0])
              }
              min={-200}
              max={200}
              step={1}
            />
          </div>
        </div>
      </div>
    </section>
  )
}

