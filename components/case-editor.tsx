"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import Image from "next/image"
import {
  CaseRecord,
  ImageRecord,
  getImageById,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"
import { BeforeAfterSlider } from "@/components/before-after-slider"

interface CaseEditorProps {
  caseRecord: CaseRecord
  images: ImageRecord[]
  onSave: (caseRecord: CaseRecord) => void
  onCancel: () => void
}

export function CaseEditor({ caseRecord, images, onSave, onCancel }: CaseEditorProps) {
  const [editedCase, setEditedCase] = useState<CaseRecord>(caseRecord)
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const [beforeImageLoaded, setBeforeImageLoaded] = useState(false)
  const [afterImageLoaded, setAfterImageLoaded] = useState(false)

  useEffect(() => {
    const loadImages = async () => {
      if (editedCase.beforeImageId) {
        const image = await getImageById(editedCase.beforeImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          setBeforeImageUrl(url)
          setBeforeImageLoaded(false)
        }
      } else {
        setBeforeImageUrl("")
        setBeforeImageLoaded(false)
      }

      if (editedCase.afterImageId) {
        const image = await getImageById(editedCase.afterImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          setAfterImageUrl(url)
          setAfterImageLoaded(false)
        }
      } else {
        setAfterImageUrl("")
        setAfterImageLoaded(false)
      }
    }

    loadImages()

    return () => {
      if (beforeImageUrl) revokeObjectURL(beforeImageUrl)
      if (afterImageUrl) revokeObjectURL(afterImageUrl)
    }
  }, [editedCase.beforeImageId, editedCase.afterImageId])

  const handleSave = () => {
    onSave(editedCase)
  }

  const handleViewChange = (
    side: "before" | "after",
    field: "scale" | "x" | "y",
    value: number
  ) => {
    setEditedCase({
      ...editedCase,
      view: {
        ...editedCase.view,
        [side]: {
          ...editedCase.view[side],
          [field]: value,
        },
      },
    })
  }

  return (
    <main className="min-h-screen bg-background">
      <header className="sticky top-0 z-40 border-b bg-card py-4 shadow-sm">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 md:px-10">
          <h1 className="text-xl font-bold">CASE編集</h1>
          <div className="flex gap-2">
            <Button variant="outline" onClick={onCancel}>
              キャンセル
            </Button>
            <Button onClick={handleSave}>保存</Button>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
        {/* Basic Info */}
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">基本情報</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">タイトル</label>
            <Input
              value={editedCase.title}
              onChange={(e) =>
                setEditedCase({ ...editedCase, title: e.target.value })
              }
              placeholder="例: CASE 01"
            />
          </div>

          <div className="space-y-2">
            <label className="text-sm font-medium">説明（任意）</label>
            <Input
              value={editedCase.description || ""}
              onChange={(e) =>
                setEditedCase({ ...editedCase, description: e.target.value })
              }
              placeholder="例: リビングの改築提案"
            />
          </div>
        </section>

        {/* Image Selection */}
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">画像選択</h2>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Before Image */}
            <div className="space-y-3">
              <label className="text-sm font-medium">改築前（Before）</label>
              <select
                value={editedCase.beforeImageId || ""}
                onChange={(e) =>
                  setEditedCase({
                    ...editedCase,
                    beforeImageId: e.target.value || undefined,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">未選択</option>
                {images.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.name}
                  </option>
                ))}
              </select>

              {beforeImageUrl && (
                <div className="relative overflow-hidden rounded border h-48">
                  {!beforeImageLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                      <svg className="h-8 w-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <Image
                    src={beforeImageUrl}
                    alt="Before preview"
                    fill
                    className="object-cover"
                    onLoad={() => setBeforeImageLoaded(true)}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>

            {/* After Image */}
            <div className="space-y-3">
              <label className="text-sm font-medium">改築後（After）</label>
              <select
                value={editedCase.afterImageId || ""}
                onChange={(e) =>
                  setEditedCase({
                    ...editedCase,
                    afterImageId: e.target.value || undefined,
                  })
                }
                className="w-full rounded-md border border-input bg-background px-3 py-2 text-sm"
              >
                <option value="">未選択</option>
                {images.map((img) => (
                  <option key={img.id} value={img.id}>
                    {img.name}
                  </option>
                ))}
              </select>

              {afterImageUrl && (
                <div className="relative overflow-hidden rounded border h-48">
                  {!afterImageLoaded && (
                    <div className="absolute inset-0 animate-pulse bg-muted flex items-center justify-center">
                      <svg className="h-8 w-8 text-muted-foreground/50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </div>
                  )}
                  <Image
                    src={afterImageUrl}
                    alt="After preview"
                    fill
                    className="object-cover"
                    onLoad={() => setAfterImageLoaded(true)}
                    sizes="(max-width: 768px) 100vw, 50vw"
                  />
                </div>
              )}
            </div>
          </div>
        </section>

        {/* Initial View Settings */}
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
                  スライダー位置: {editedCase.initialSliderPosition}%
                </label>
                <span className="text-xs text-muted-foreground">
                  {editedCase.initialSliderPosition < 30 && "Before中心"}
                  {editedCase.initialSliderPosition >= 30 && editedCase.initialSliderPosition < 70 && "バランス"}
                  {editedCase.initialSliderPosition >= 70 && "After中心"}
                </span>
              </div>
              <Slider
                value={[editedCase.initialSliderPosition]}
                onValueChange={(value) =>
                  setEditedCase({ ...editedCase, initialSliderPosition: value[0] })
                }
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
                    name={`animation-${editedCase.id}`}
                    value="none"
                    checked={editedCase.animationType === 'none'}
                    onChange={(e) =>
                      setEditedCase({ ...editedCase, animationType: e.target.value as 'none' | 'demo' })
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
                    name={`animation-${editedCase.id}`}
                    value="demo"
                    checked={editedCase.animationType === 'demo'}
                    onChange={(e) =>
                      setEditedCase({ ...editedCase, animationType: e.target.value as 'none' | 'demo' })
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
                  拡大率: {editedCase.view.before.scale}%
                </label>
                <Slider
                  value={[editedCase.view.before.scale]}
                  onValueChange={(value) =>
                    handleViewChange("before", "scale", value[0])
                  }
                  min={50}
                  max={200}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  水平位置: {editedCase.view.before.x}px
                </label>
                <Slider
                  value={[editedCase.view.before.x]}
                  onValueChange={(value) =>
                    handleViewChange("before", "x", value[0])
                  }
                  min={-200}
                  max={200}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  垂直位置: {editedCase.view.before.y}px
                </label>
                <Slider
                  value={[editedCase.view.before.y]}
                  onValueChange={(value) =>
                    handleViewChange("before", "y", value[0])
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
                  拡大率: {editedCase.view.after.scale}%
                </label>
                <Slider
                  value={[editedCase.view.after.scale]}
                  onValueChange={(value) =>
                    handleViewChange("after", "scale", value[0])
                  }
                  min={50}
                  max={200}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  水平位置: {editedCase.view.after.x}px
                </label>
                <Slider
                  value={[editedCase.view.after.x]}
                  onValueChange={(value) =>
                    handleViewChange("after", "x", value[0])
                  }
                  min={-200}
                  max={200}
                  step={1}
                />
              </div>

              <div className="space-y-2">
                <label className="text-sm font-medium">
                  垂直位置: {editedCase.view.after.y}px
                </label>
                <Slider
                  value={[editedCase.view.after.y]}
                  onValueChange={(value) =>
                    handleViewChange("after", "y", value[0])
                  }
                  min={-200}
                  max={200}
                  step={1}
                />
              </div>
            </div>
          </div>
        </section>

        {/* Preview */}
        {beforeImageUrl && afterImageUrl && (
          <section className="space-y-4 rounded-lg border bg-card p-6">
            <h2 className="text-lg font-semibold">プレビュー</h2>
            <BeforeAfterSlider
              beforeImage={beforeImageUrl}
              afterImage={afterImageUrl}
              beforeLabel="Before"
              afterLabel="After"
              defaultBeforeScale={editedCase.view.before.scale}
              defaultBeforeX={editedCase.view.before.x}
              defaultBeforeY={editedCase.view.before.y}
              defaultAfterScale={editedCase.view.after.scale}
              defaultAfterX={editedCase.view.after.x}
              defaultAfterY={editedCase.view.after.y}
              className="border border-border bg-white shadow-lg"
            />
          </section>
        )}
      </div>
    </main>
  )
}

