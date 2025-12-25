"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Slider } from "@/components/ui/slider"
import {
  CaseRecord,
  ImageRecordWithBlob,
  getImageById,
  createObjectURL,
  revokeObjectURL,
} from "@/lib/db"
import { BeforeAfterSlider } from "@/components/before-after-slider"
import { ImagePicker } from "@/components/image-picker"
import { useToast } from "@/components/ui/toast"

interface CaseEditorProps {
  caseRecord: CaseRecord
  images: ImageRecordWithBlob[]
  onSave: (caseRecord: CaseRecord) => void
  onCancel: () => void
}

export function CaseEditor({ caseRecord, images, onSave, onCancel }: CaseEditorProps) {
  const [editedCase, setEditedCase] = useState<CaseRecord>(caseRecord)
  const [beforeImageUrl, setBeforeImageUrl] = useState<string>("")
  const [afterImageUrl, setAfterImageUrl] = useState<string>("")
  const { showToast } = useToast()

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
    // バリデーション
    if (!editedCase.title.trim()) {
      showToast("タイトルを入力してください", "warning")
      return
    }

    if (!editedCase.beforeImageId || !editedCase.afterImageId) {
      showToast("Before/After両方の画像を選択してください", "warning")
      return
    }

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
    <div className="mx-auto max-w-7xl space-y-8 px-6 py-10 md:px-10">
      {/* Header Section */}
      <div className="flex items-center justify-between border-b pb-4">
        <h1 className="text-xl font-bold">CASE編集</h1>
        <div className="flex gap-2">
          <Button variant="outline" onClick={onCancel}>
            キャンセル
          </Button>
          <Button onClick={handleSave}>保存</Button>
        </div>
      </div>
        {/* Basic Info */}
        <section className="space-y-4 rounded-lg border bg-card p-6">
          <h2 className="text-lg font-semibold">基本情報</h2>
          
          <div className="space-y-2">
            <label className="text-sm font-medium">
              タイトル <span className="text-destructive">*</span>
            </label>
            <Input
              value={editedCase.title}
              onChange={(e) =>
                setEditedCase({ ...editedCase, title: e.target.value })
              }
              placeholder="例: CASE 01"
              required
              className={!editedCase.title.trim() ? "border-destructive" : ""}
            />
            {!editedCase.title.trim() && (
              <p className="text-xs text-destructive">タイトルは必須です</p>
            )}
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
            <ImagePicker
              images={images}
              selectedImageId={editedCase.beforeImageId}
              onSelect={(imageId) =>
                setEditedCase({
                  ...editedCase,
                  beforeImageId: imageId,
                })
              }
              label="改築前（Before）"
            />

            {/* After Image */}
            <ImagePicker
              images={images}
              selectedImageId={editedCase.afterImageId}
              onSelect={(imageId) =>
                setEditedCase({
                  ...editedCase,
                  afterImageId: imageId,
                })
              }
              label="改築後（After）"
            />
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
  )
}

