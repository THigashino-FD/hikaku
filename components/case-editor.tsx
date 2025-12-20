"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
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

  useEffect(() => {
    const loadImages = async () => {
      if (editedCase.beforeImageId) {
        const image = await getImageById(editedCase.beforeImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          setBeforeImageUrl(url)
        }
      } else {
        setBeforeImageUrl("")
      }

      if (editedCase.afterImageId) {
        const image = await getImageById(editedCase.afterImageId)
        if (image) {
          const url = createObjectURL(image.blob)
          setAfterImageUrl(url)
        }
      } else {
        setAfterImageUrl("")
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
                <div className="overflow-hidden rounded border">
                  <img
                    src={beforeImageUrl}
                    alt="Before preview"
                    className="h-48 w-full object-cover"
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
                <div className="overflow-hidden rounded border">
                  <img
                    src={afterImageUrl}
                    alt="After preview"
                    className="h-48 w-full object-cover"
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
            閲覧ページで最初に表示される際のズーム・位置を設定します
          </p>

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

