"use client"

import { ImagePicker } from "@/components/image-picker"
import type { ImageRecordWithBlob } from "@/lib/db"

interface ImageSelectionSectionProps {
  images: ImageRecordWithBlob[]
  beforeImageId?: string
  afterImageId?: string
  onBeforeSelect: (imageId?: string) => void
  onAfterSelect: (imageId?: string) => void
}

export function ImageSelectionSection({
  images,
  beforeImageId,
  afterImageId,
  onBeforeSelect,
  onAfterSelect,
}: ImageSelectionSectionProps) {
  return (
    <section className="space-y-4 rounded-lg border bg-card p-6">
      <h2 className="text-lg font-semibold">画像選択</h2>

      <div className="grid gap-6 md:grid-cols-2">
        {/* Before Image */}
        <ImagePicker
          images={images}
          selectedImageId={beforeImageId}
          onSelect={onBeforeSelect}
          label="改築前（Before）"
        />

        {/* After Image */}
        <ImagePicker
          images={images}
          selectedImageId={afterImageId}
          onSelect={onAfterSelect}
          label="改築後（After）"
        />
      </div>
    </section>
  )
}

